"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { ActionForm, SelectField, TextField } from "@/components/ui/action-form";
import { buttonStyles } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { register } from "@/lib/actions/auth";
import { DEPARTMENTS, YEARS } from "@/lib/constants";

// Field names match registerSchema in lib/validation.ts.
export function RegisterForm() {
  // register() redirects when Supabase starts a session right away. When "Confirm email"
  // is on it returns ok:true instead, and we swap the form for this message.
  const [emailSent, setEmailSent] = useState(false);

  if (emailSent) {
    return (
      <div role="status" className="mt-8 animate-rise rounded-2xl border border-pine-200 bg-pine-50 p-6 sm:p-8">
        <span className="flex size-12 items-center justify-center rounded-full bg-pine-100 text-pine-700">
          <MailCheck className="size-6" />
        </span>
        <h2 className="mt-4 text-2xl font-semibold">Check your email</h2>
        <p className="mt-2 text-sm text-muted">
          Your account has been created. We sent a confirmation link to your inbox: open it to activate your
          account, then log in.
        </p>
        <Link href="/login" className={buttonStyles({ className: "mt-6" })}>
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <ActionForm action={register} onSuccess={() => setEmailSent(true)} className="mt-8 space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Full name" name="full_name" autoComplete="name" minLength={2} maxLength={80} required />
        <TextField
          label="Student ID"
          name="student_id"
          hint="4-15 letters or digits, as on your ID card"
          pattern="[A-Za-z0-9]{4,15}"
          maxLength={15}
          autoCapitalize="characters"
          autoComplete="off"
          required
        />
        <SelectField
          label="Department"
          name="department"
          options={DEPARTMENTS}
          placeholder="Select department"
          required
        />
        <SelectField label="Year" name="year" options={YEARS} placeholder="Select year" required />
        <div className="sm:col-span-2">
          <TextField
            label="College email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@college.edu"
            required
          />
        </div>
        <TextField
          label="Password"
          name="password"
          type="password"
          hint="At least 8 characters"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <TextField
          label="Confirm password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <SubmitButton size="lg" className="w-full">
        Create account
      </SubmitButton>
    </ActionForm>
  );
}
