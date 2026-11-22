import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="w-full max-w-xl animate-rise">
      <p className="eyebrow text-marigold-700">Join StudyCircle</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Create your student account</h1>
      <p className="mt-2 text-muted">Use your college details so clubs and organisers know who you are.</p>

      <RegisterForm />

      <p className="mt-8 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="rounded-sm font-semibold text-pine-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine-600"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
