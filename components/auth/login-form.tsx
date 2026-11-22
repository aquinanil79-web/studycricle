import { ActionForm, TextField } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { login } from "@/lib/actions/auth";

// No "use client" needed: a Server Component may pass a Server Action to <ActionForm>.
// On success login() redirects to /dashboard; on failure the error shows as a toast.
export function LoginForm() {
  return (
    <ActionForm action={login} className="mt-8 space-y-5">
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@college.edu"
        required
      />
      <TextField label="Password" name="password" type="password" autoComplete="current-password" required />
      <SubmitButton size="lg" className="w-full">
        Log in
      </SubmitButton>
    </ActionForm>
  );
}
