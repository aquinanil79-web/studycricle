import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { pool, db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { profiles } from "@/lib/db/schema";
import type { Profile } from "@/lib/types";

const authOrigins = process.env.NODE_ENV === "development"
  ? ["http://localhost:3000", ...[process.env.V0_RUNTIME_URL, process.env.V0_DEV_APP_URL, process.env.V0_BUILD_URL, process.env.V0_SANDBOX_URL].filter((value): value is string => Boolean(value))]
  : [process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL].filter((value): value is string => Boolean(value)).map((value) => `https://${value}`);

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  baseURL: process.env.BETTER_AUTH_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.V0_RUNTIME_URL),
  emailAndPassword: { enabled: true, autoSignIn: true, minPasswordLength: 8 },
  trustedOrigins: authOrigins,
  ...(process.env.NODE_ENV === "development" ? { advanced: { defaultCookieAttributes: { sameSite: "none" as const, secure: true } } } : {}),
  plugins: [nextCookies()],
});

export const getCurrentUser = cache(async (): Promise<Profile | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, session.user.id)).limit(1);
  return profile ? { ...profile, created_at: new Date(profile.created_at).toISOString(), updated_at: new Date(profile.updated_at).toISOString() } : null;
});

export async function requireUser(): Promise<Profile> {
  const profile = await getCurrentUser();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireUser();
  if (profile.role !== "admin") redirect("/dashboard");
  return profile;
}
