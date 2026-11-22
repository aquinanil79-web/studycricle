"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { announcements } from "@/lib/db/schema";
import type { ActionState } from "@/lib/types";
import { announcementSchema, idSchema, parseForm } from "@/lib/validation";
import { failed, succeeded } from "./result";

function refreshAnnouncementPages() {
  revalidatePath("/announcements");
  revalidatePath("/dashboard");
  revalidatePath("/admin/announcements");
}

export async function createAnnouncement(_state: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const { data, error } = parseForm(announcementSchema, formData);
  if (error) return error;
  try { await db.insert(announcements).values({ ...data, author_id: admin.id }); }
  catch (cause) { return failed({ message: String(cause) }, "Could not publish the announcement."); }
  refreshAnnouncementPages();
  return succeeded("Announcement published.");
}

export async function updateAnnouncement(announcementId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  if (!idSchema.safeParse(announcementId).success) return { ok: false, message: "Invalid announcement." };
  const { data, error } = parseForm(announcementSchema, formData);
  if (error) return error;
  try { await db.update(announcements).set({ ...data, updated_at: new Date().toISOString() }).where(eq(announcements.id, announcementId)); }
  catch (cause) { return failed({ message: String(cause) }, "Could not update the announcement."); }
  refreshAnnouncementPages();
  return succeeded("Announcement updated.");
}

export async function deleteAnnouncement(announcementId: string): Promise<ActionState> {
  await requireAdmin();
  if (!idSchema.safeParse(announcementId).success) return { ok: false, message: "Invalid announcement." };
  try { await db.delete(announcements).where(eq(announcements.id, announcementId)); }
  catch (cause) { return failed({ message: String(cause) }, "Could not delete the announcement."); }
  refreshAnnouncementPages();
  return succeeded("Announcement deleted.");
}
