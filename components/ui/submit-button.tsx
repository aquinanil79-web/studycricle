"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { useActionForm } from "./action-form";
import { Button } from "./button";

/**
 * Submit button that disables itself and shows a spinner while the form is submitting.
 * Works inside <ActionForm> and inside a plain <form action={serverAction}>.
 */
export function SubmitButton({ children, disabled, ...props }: ComponentProps<typeof Button>) {
  const status = useFormStatus();
  const form = useActionForm();
  const pending = status.pending || form.pending;

  return (
    <Button {...props} type="submit" disabled={pending || disabled} aria-busy={pending}>
      {pending && <LoaderCircle className="size-4 animate-spin" />}
      {children}
    </Button>
  );
}
