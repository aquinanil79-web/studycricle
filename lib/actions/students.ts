"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { account, club_members, comments, event_registrations, media_objects, profiles, resources, session, user } from "@/lib/db/schema";
import type { ActionState, Role } from "@/lib/types";
import { idSchema } from "@/lib/validation";
import { failed, succeeded } from "./result";

export async function setUserRole(userId: string, role: Role): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!idSchema.safeParse(userId).success || (role !== "student" && role !== "admin")) return { ok: false, message: "Invalid request." };
  if (userId === admin.id) return { ok: false, message: "You cannot change your own role." };
  try { await db.update(profiles).set({ role, updated_at: new Date().toISOString() }).where(eq(profiles.id, userId)); }
  catch (cause) { return failed({ message: String(cause) }, "Could not change the role."); }
  revalidatePath("/admin/students");
  return succeeded(role === "admin" ? "User is now an admin." : "Admin rights removed.");
}

export async function deleteStudent(userId: string): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!idSchema.safeParse(userId).success) return { ok: false, message: "Invalid request." };
  if (userId === admin.id) return { ok: false, message: "You cannot remove your own account." };
  const [profile] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.id, userId)).limit(1);
  if (!profile) return { ok: false, message: "Student not found." };
  if (profile.role === "admin") return { ok: false, message: "Remove admin rights before deleting this account." };
  try {
    await db.transaction(async (tx) => {
      await tx.delete(comments).where(eq(comments.author_id, userId));
      await tx.delete(club_members).where(eq(club_members.user_id, userId));
      await tx.delete(event_registrations).where(eq(event_registrations.user_id, userId));
      const files = await tx.select({ file_name: media_objects.file_name }).from(media_objects).where(eq(media_objects.owner_id, userId));
      for (const file of files) await tx.delete(resources).where(eq(resources.file_path, file.file_name));
      await tx.delete(media_objects).where(eq(media_objects.owner_id, userId));
      await tx.delete(profiles).where(eq(profiles.id, userId));
      await tx.delete(account).where(eq(account.userId, userId));
      await tx.delete(session).where(eq(session.userId, userId));
      await tx.delete(user).where(eq(user.id, userId));
    });
  } catch (cause) { return failed({ message: String(cause) }, "Could not remove the student."); }
  revalidatePath("/admin/students");
  revalidatePath("/admin");
  return succeeded("Student removed.");
}
