"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { club_members, clubs } from "@/lib/db/schema";
import type { ActionState } from "@/lib/types";
import { clubSchema, idSchema, parseForm } from "@/lib/validation";
import { failed, succeeded, UNIQUE_VIOLATION } from "./result";

function refreshClubPages(clubId?: string) {
  revalidatePath("/clubs");
  if (clubId) revalidatePath(`/clubs/${clubId}`);
  revalidatePath("/dashboard");
  revalidatePath("/admin/clubs");
  revalidatePath("/");
}

const duplicateName = { ok: false, message: "A club with this name already exists.", errors: { name: ["A club with this name already exists."] } };

export async function joinClub(clubId: string): Promise<ActionState> {
  const user = await requireUser();
  if (!idSchema.safeParse(clubId).success) return { ok: false, message: "Invalid club." };
  try {
    await db.insert(club_members).values({ club_id: clubId, user_id: user.id });
  } catch (error) {
    if ((error as { code?: string }).code === UNIQUE_VIOLATION) return { ok: false, message: "You are already a member of this club." };
    return failed({ message: String(error) }, "Could not join the club.");
  }
  refreshClubPages(clubId);
  return succeeded("Welcome to the club!");
}

export async function leaveClub(clubId: string): Promise<ActionState> {
  const user = await requireUser();
  if (!idSchema.safeParse(clubId).success) return { ok: false, message: "Invalid club." };
  await db.delete(club_members).where(and(eq(club_members.club_id, clubId), eq(club_members.user_id, user.id)));
  refreshClubPages(clubId);
  return succeeded("You left the club.");
}

export async function createClub(_state: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const { data, error } = parseForm(clubSchema, formData);
  if (error) return error;
  try { await db.insert(clubs).values({ ...data, created_by: admin.id }); }
  catch (cause) {
    if ((cause as { code?: string }).code === UNIQUE_VIOLATION) return duplicateName;
    return failed({ message: String(cause) }, "Could not create the club.");
  }
  refreshClubPages();
  return succeeded(`"${data.name}" created.`);
}

export async function updateClub(clubId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  if (!idSchema.safeParse(clubId).success) return { ok: false, message: "Invalid club." };
  const { data, error } = parseForm(clubSchema, formData);
  if (error) return error;
  try { await db.update(clubs).set(data).where(eq(clubs.id, clubId)); }
  catch (cause) {
    if ((cause as { code?: string }).code === UNIQUE_VIOLATION) return duplicateName;
    return failed({ message: String(cause) }, "Could not update the club.");
  }
  refreshClubPages(clubId);
  return succeeded(`"${data.name}" updated.`);
}

export async function deleteClub(clubId: string): Promise<ActionState> {
  await requireAdmin();
  if (!idSchema.safeParse(clubId).success) return { ok: false, message: "Invalid club." };
  await db.delete(clubs).where(eq(clubs.id, clubId));
  refreshClubPages(clubId);
  return succeeded("Club deleted.");
}
