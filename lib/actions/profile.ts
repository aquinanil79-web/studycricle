"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import type { ActionState } from "@/lib/types";
import { parseForm, profileSchema } from "@/lib/validation";
import { succeeded, UNIQUE_VIOLATION } from "./result";

export async function updateProfile(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const { data, error } = parseForm(profileSchema, formData);
  if (error) return error;
  try {
    await db.update(profiles).set({ ...data, updated_at: new Date().toISOString() }).where(eq(profiles.id, user.id));
  } catch (cause) {
    if ((cause as { code?: string }).code === UNIQUE_VIOLATION) return { ok: false, message: "This student ID belongs to another account.", errors: { student_id: ["This student ID belongs to another account."] } };
    console.error("[profile] update failed", cause);
    return { ok: false, message: "Could not save your profile." };
  }
  revalidatePath("/", "layout");
  return succeeded("Profile saved.");
}
