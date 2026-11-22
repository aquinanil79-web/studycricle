import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  // Set by app/auth/confirm/route.ts when an email confirmation link is invalid or expired.
  const confirmFailed = (await searchParams).confirm === "failed";

  return (
    <div className="w-full max-w-md animate-rise">
      <p className="eyebrow text-marigold-700">Welcome back</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Log in to StudyCircle</h1>
      <p className="mt-2 text-muted">See what is happening on campus today.</p>

      {confirmFailed && (
        <p role="alert" className="mt-6 rounded-xl border border-marigold-200 bg-marigold-50 px-4 py-3 text-sm text-marigold-700">
          That confirmation link is invalid or has expired. If you already confirmed your email, just log in.
        </p>
      )}

      <LoginForm />

      <p className="mt-8 text-center text-sm text-muted">
        New to StudyCircle?{" "}
        <Link
          href="/register"
          className="rounded-sm font-semibold text-pine-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine-600"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
