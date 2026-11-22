"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import type { ActionState } from "@/lib/types";
import { loginSchema, parseForm, registerSchema } from "@/lib/validation";

export async function login(_state: ActionState, formData: FormData): Promise<ActionState> {
  const { data, error } = parseForm(loginSchema, formData);
  if (error) return error;
  try {
    const result = await auth.api.signInEmail({ body: data, headers: await headers() });
    if (!result.user) return { ok: false, message: "Incorrect email or password." };
  } catch {
    return { ok: false, message: "Incorrect email or password." };
  }
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function register(_state: ActionState, formData: FormData): Promise<ActionState> {
  const { data, error } = parseForm(registerSchema, formData);
  if (error) return error;
  const [existingStudent] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.student_id, data.student_id)).limit(1);
  if (existingStudent) return { ok: false, message: "This student ID is already registered.", errors: { student_id: ["This student ID may already be registered."] } };

  try {
    const result = await auth.api.signUpEmail({ body: { name: data.full_name, email: data.email, password: data.password }, headers: await headers() });
    await db.insert(profiles).values({
      id: result.user.id, full_name: data.full_name, email: data.email, student_id: data.student_id,
      department: data.department, year: data.year, role: "student",
    });
  } catch (cause) {
    console.error("[auth] registration failed", cause);
    return { ok: false, message: "Could not create the account. Check your details or try logging in." };
  }
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  await auth.api.signOut({ headers: await headers() });
  revalidatePath("/", "layout");
  redirect("/login");
}
