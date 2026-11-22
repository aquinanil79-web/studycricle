import type { ActionState } from "@/lib/types";

// Postgres error codes we turn into friendly messages.
export const UNIQUE_VIOLATION = "23505";

/** Logs the real error on the server and returns a message that is safe to show the user. */
export function failed(
  error: { code?: string; message: string },
  message = "Something went wrong. Please try again.",
): NonNullable<ActionState> {
  console.error(error);
  return { ok: false, message };
}

export function succeeded(message: string): NonNullable<ActionState> {
  return { ok: true, message };
}
