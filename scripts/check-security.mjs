// Automated Row Level Security check for CampusHub.
// It talks to Supabase exactly like the browser does (publishable key only), as an
// anonymous visitor, as a seeded student and as the seeded admin, and verifies that
// the database itself refuses everything a user is not allowed to do.
//
// Run after seeding: SEED_PASSWORD='same-as-seed' npm run check:security
// Exit code 1 if any check fails. Everything the checks create is removed again.

import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const password = process.env.SEED_PASSWORD;

if (!url || !publishableKey || !password) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (.env.local) and SEED_PASSWORD.");
  process.exit(1);
}

const STUDENT_EMAIL = "aarav.sharma@campushub.test";
const ADMIN_EMAIL = "admin@campushub.test";

const newClient = () =>
  createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function signIn(email) {
  const client = newClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    console.error(`Could not sign in as ${email}: ${error.message}`);
    console.error(`Run "npm run seed" first, with the same SEED_PASSWORD.`);
    process.exit(1);
  }
  return { client, id: data.user.id };
}

// ---------- tiny test runner ----------

const color = process.stdout.isTTY;
const PASS = color ? "\x1b[32mPASS\x1b[0m" : "PASS";
const FAIL = color ? "\x1b[31mFAIL\x1b[0m" : "FAIL";
let passed = 0;
let failed = 0;

/** Runs one named check. `run` returns [ok, note]; the note explains what the database said. */
async function check(name, run) {
  let ok = false;
  let note;
  try {
    [ok, note] = await run();
  } catch (error) {
    note = error.message;
  }
  if (ok) passed++;
  else failed++;
  console.log(`  ${ok ? PASS : FAIL}  ${name}${note ? `  (${note})` : ""}`);
}

const section = (title) => console.log(`\n${title}`);

// RLS stops a request in one of two ways: an error (inserts, missing grants) or by
// hiding the rows, so an update/delete/select simply affects 0 rows.
const rows = (data) => `${data?.length ?? 0} row${data?.length === 1 ? "" : "s"}`;
const blocked = ({ data, error }) => (error ? [true, error.message] : [!data?.length, `${rows(data)} affected`]);
const allowed = ({ data, error }) => (error ? [false, error.message] : [data?.length > 0, rows(data)]);

/** Throws a readable error when a setup step failed, so dependent checks show FAIL instead of crashing. */
function need(value, what) {
  if (!value) throw new Error(`setup failed: ${what}`);
  return value;
}

// ---------- setup ----------

console.log(`CampusHub security check against ${url}`);
const anon = newClient();
const student = await signIn(STUDENT_EMAIL);
const admin = await signIn(ADMIN_EMAIL);
console.log(`Signed in as student ${STUDENT_EMAIL} and admin ${ADMIN_EMAIL}.`);

const { data: others } = await student.client
  .from("profiles")
  .select("id, bio")
  .eq("role", "student")
  .neq("id", student.id)
  .limit(1);
const other = others?.[0];
const { data: resourceFiles } = await student.client.from("resources").select("file_path").limit(1);
const resourcePath = resourceFiles?.[0]?.file_path;
const tag = randomUUID().slice(0, 8); // makes names of temporary rows unique

// ---------- anonymous visitor ----------

section("Anonymous visitor (not logged in)");
for (const table of ["profiles", "announcements", "resources"]) {
  await check(`cannot read ${table}`, async () => blocked(await anon.from(table).select("id")));
}
for (const table of ["clubs", "events"]) {
  await check(`can read ${table} (public landing page)`, async () => allowed(await anon.from(table).select("id")));
}
await check("cannot create a signed download URL for a resource file", async () => {
  const { data, error } = await anon.storage.from("resources").createSignedUrl(need(resourcePath, "no resource"), 60);
  return [Boolean(error) && !data?.signedUrl, error?.message ?? "a signed URL was created"];
});

// ---------- clubs and announcements ----------

section("Clubs and announcements (admin only)");
let tempClub;
await check("admin can create a club", async () => {
  const result = await admin.client
    .from("clubs")
    .insert({
      name: `RLS check club ${tag}`,
      description: "Temporary club created by the security check script.",
      category: "Technical",
      created_by: admin.id,
    })
    .select("id");
  tempClub = result.data?.[0];
  return allowed(result);
});

await check("student cannot create a club", async () => {
  const result = await student.client
    .from("clubs")
    .insert({ name: `RLS student club ${tag}`, description: "Should never be saved.", category: "Technical" })
    .select("id");
  // If RLS is broken the row exists; remove it again with the admin account.
  if (result.data?.length) await admin.client.from("clubs").delete().eq("id", result.data[0].id);
  return blocked(result);
});

await check("student cannot update a club", async () =>
  blocked(
    await student.client
      .from("clubs")
      .update({ description: "Hacked by a student" })
      .eq("id", need(tempClub, "temporary club").id)
      .select("id"),
  ),
);

await check("student cannot delete a club", async () =>
  blocked(await student.client.from("clubs").delete().eq("id", need(tempClub, "temporary club").id).select("id")),
);

await check("student cannot publish an announcement", async () => {
  const result = await student.client
    .from("announcements")
    .insert({ title: "Fake notice", content: "Classes are cancelled tomorrow!", category: "General", author_id: student.id })
    .select("id");
  if (result.data?.length) await admin.client.from("announcements").delete().eq("id", result.data[0].id);
  return blocked(result);
});

// ---------- profiles ----------

section("Profiles");
await check("student cannot change their own role", async () => {
  const result = await student.client.from("profiles").update({ role: "admin" }).eq("id", student.id).select("id");
  return [Boolean(result.error), result.error?.message ?? "role was updated"];
});

await check("student cannot update another student's profile", async () =>
  // Writing the other student's current bio back means nothing changes even if RLS were broken.
  blocked(
    await student.client
      .from("profiles")
      .update({ bio: need(other, "second student").bio })
      .eq("id", other.id)
      .select("id"),
  ),
);

await check("student can update their own bio", async () => {
  const { data: me } = await student.client.from("profiles").select("bio").eq("id", student.id).single();
  const result = await student.client
    .from("profiles")
    .update({ bio: `Temporary bio from the security check ${tag}` })
    .eq("id", student.id)
    .select("id");
  await student.client.from("profiles").update({ bio: me?.bio ?? null }).eq("id", student.id); // restore
  return allowed(result);
});

// ---------- memberships and registrations ----------

section("Club memberships and event registrations");
await check("student cannot join a club on behalf of another user", async () => {
  const result = await student.client
    .from("club_members")
    .insert({ club_id: need(tempClub, "temporary club").id, user_id: need(other, "second student").id })
    .select("id");
  return blocked(result); // a wrongly inserted row disappears when the temporary club is deleted
});

await check("student can join and leave a club", async () => {
  const clubId = need(tempClub, "temporary club").id;
  const joined = await student.client.from("club_members").insert({ club_id: clubId, user_id: student.id }).select("id");
  if (joined.error) return [false, `join: ${joined.error.message}`];
  const left = await student.client.from("club_members").delete().eq("id", joined.data[0].id).select("id");
  return [left.data?.length === 1, left.error?.message ?? "joined, then left"];
});

let tempEvent;
await check("duplicate event registration is rejected (23505)", async () => {
  // A temporary event with free seats, so only the unique constraint can stop the second insert.
  const created = await admin.client
    .from("events")
    .insert({
      title: `RLS check event ${tag}`,
      description: "Temporary event created by the security check script.",
      event_date: "2099-01-01",
      event_time: "10:00",
      location: "Nowhere",
      organizer: "Security check",
      capacity: 5,
    })
    .select("id");
  tempEvent = need(created.data?.[0], `temporary event (${created.error?.message})`);
  const row = { event_id: tempEvent.id, user_id: student.id };
  const first = await student.client.from("event_registrations").insert(row);
  if (first.error) return [false, `first registration: ${first.error.message}`];
  const second = await student.client.from("event_registrations").insert(row);
  return [second.error?.code === "23505", second.error?.message ?? "registered twice"];
});

await check("registering for a full event is rejected (EVENT_FULL)", async () => {
  const { data: events } = await student.client.from("events").select("id, title, capacity, event_registrations(count)");
  const full = need(
    events?.find((event) => event.event_registrations[0].count >= event.capacity),
    'a full event (run "npm run seed")',
  );
  const result = await student.client
    .from("event_registrations")
    .insert({ event_id: full.id, user_id: student.id })
    .select("id");
  if (result.data?.length) await student.client.from("event_registrations").delete().eq("id", result.data[0].id);
  return [Boolean(result.error?.message.includes("EVENT_FULL")), `${full.title}: ${result.error?.message ?? "registered"}`];
});

// ---------- comments ----------

section("Comments");
await check("student cannot delete another user's comment", async () => {
  // The admin writes a comment on the temporary club; the student then tries to delete it.
  const created = await admin.client
    .from("comments")
    .insert({ content: "Comment from the security check.", author_id: admin.id, club_id: need(tempClub, "temporary club").id })
    .select("id");
  const comment = need(created.data?.[0], `admin comment (${created.error?.message})`);
  return blocked(await student.client.from("comments").delete().eq("id", comment.id).select("id"));
});

// ---------- storage ----------

section('Storage (private "resources" bucket)');
const file = Buffer.from("Uploaded by the CampusHub security check.\n");

await check("student cannot upload into another user's folder", async () => {
  const path = `${need(other, "second student").id}/rls-check-${tag}.txt`;
  const { data, error } = await student.client.storage.from("resources").upload(path, file, { contentType: "text/plain" });
  if (data) await admin.client.storage.from("resources").remove([path]);
  return [Boolean(error), error?.message ?? "upload succeeded"];
});

await check("student can upload into their own folder and delete the file", async () => {
  const path = `${student.id}/rls-check-${tag}.txt`;
  const upload = await student.client.storage.from("resources").upload(path, file, { contentType: "text/plain" });
  if (upload.error) return [false, `upload: ${upload.error.message}`];
  const removed = await student.client.storage.from("resources").remove([path]);
  return [removed.data?.length === 1, removed.error?.message ?? "uploaded, then deleted"];
});

await check("student can create a signed download URL for a resource file", async () => {
  const { data, error } = await student.client.storage.from("resources").createSignedUrl(need(resourcePath, "no resource"), 60);
  return [Boolean(data?.signedUrl), error?.message ?? "signed URL valid for 60 seconds"];
});

// ---------- cleanup ----------

section("Cleanup");
if (tempEvent) await admin.client.from("events").delete().eq("id", tempEvent.id); // cascades to its registrations
await check("admin can delete a club", async () =>
  // Deleting the temporary club also removes its test comment and memberships (on delete cascade).
  allowed(await admin.client.from("clubs").delete().eq("id", need(tempClub, "temporary club").id).select("id")),
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
