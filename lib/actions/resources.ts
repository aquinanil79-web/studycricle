"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { media_objects, resources } from "@/lib/db/schema";
import type { ActionState } from "@/lib/types";
import { idSchema, parseForm, resourceDetailsSchema, resourceSchema } from "@/lib/validation";
import { failed, succeeded } from "./result";

function refreshResourcePages() {
  revalidatePath("/resources");
  revalidatePath("/dashboard");
  revalidatePath("/admin/resources");
}

export async function createResource(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const { data, error } = parseForm(resourceSchema, formData);
  if (error) return error;
  if (!data.file_path.startsWith(`${user.id}/`)) return { ok: false, message: "Please upload the file again.", errors: { file_path: ["Upload the file again."] } };
  try {
    const [file] = await db.select({ id: media_objects.id }).from(media_objects).where(and(eq(media_objects.owner_id, user.id), eq(media_objects.category, "resource"), eq(media_objects.file_name, data.file_path))).limit(1);
    if (!file) return { ok: false, message: "Upload not found. Please choose the file again." };
    await db.insert(resources).values({ ...data, uploaded_by: user.id });
  } catch (cause) { return failed({ message: String(cause) }, "Could not save the resource."); }
  refreshResourcePages();
  return succeeded(`"${data.title}" shared with everyone.`);
}

export async function updateResource(resourceId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!idSchema.safeParse(resourceId).success) return { ok: false, message: "Invalid resource." };
  const { data, error } = parseForm(resourceDetailsSchema, formData);
  if (error) return error;
  const condition = user.role === "admin" ? eq(resources.id, resourceId) : and(eq(resources.id, resourceId), eq(resources.uploaded_by, user.id));
  const updated = await db.update(resources).set(data).where(condition).returning({ id: resources.id });
  if (!updated.length) return { ok: false, message: "You can only edit resources you uploaded." };
  refreshResourcePages();
  return succeeded("Resource updated.");
}

export async function deleteResource(resourceId: string): Promise<ActionState> {
  const user = await requireUser();
  if (!idSchema.safeParse(resourceId).success) return { ok: false, message: "Invalid resource." };
  const condition = user.role === "admin" ? eq(resources.id, resourceId) : and(eq(resources.id, resourceId), eq(resources.uploaded_by, user.id));
  const [deleted] = await db.delete(resources).where(condition).returning({ file_path: resources.file_path });
  if (!deleted) return { ok: false, message: "You can only delete the resource you uploaded." };
  const mediaCondition = user.role === "admin"
    ? and(eq(media_objects.file_name, deleted.file_path), eq(media_objects.category, "resource"))
    : and(eq(media_objects.owner_id, user.id), eq(media_objects.file_name, deleted.file_path), eq(media_objects.category, "resource"));
  await db.delete(media_objects).where(mediaCondition);
  refreshResourcePages();
  return succeeded("Resource deleted.");
}
