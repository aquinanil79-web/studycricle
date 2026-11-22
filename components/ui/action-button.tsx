"use client";

import { useState, useTransition, type ComponentProps, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import type { ActionState } from "@/lib/types";
import { Button } from "./button";
import { Modal } from "./modal";

type ButtonAction = () => Promise<ActionState>;
type ButtonLook = Omit<ComponentProps<typeof Button>, "onClick" | "type">;

// Runs a Server Action and reports its result as a toast.
function useRunAction(action: ButtonAction, onDone?: () => void) {
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      try {
        const result = await action();
        if (result?.ok) toast.success(result.message);
        else if (result) toast.error(result.message);
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
      onDone?.();
    });
  }

  return { pending, run };
}

/**
 * Button that runs a Server Action when clicked (Join, Leave, Register, Cancel...).
 * Pass extra arguments with bind: <ActionButton action={joinClub.bind(null, club.id)}>Join</ActionButton>
 */
export function ActionButton({
  action,
  children,
  disabled,
  ...props
}: ButtonLook & { action: ButtonAction }) {
  const { pending, run } = useRunAction(action);

  return (
    <Button {...props} onClick={run} disabled={pending || disabled} aria-busy={pending}>
      {pending && <LoaderCircle className="size-4 animate-spin" />}
      {children}
    </Button>
  );
}

/**
 * Like ActionButton, but asks for confirmation first. Use it for destructive actions.
 *
 * <ConfirmButton action={deleteClub.bind(null, club.id)} title="Delete club?"
 *   description="All memberships and comments will be removed." aria-label="Delete club">
 *   <Trash className="size-4" />
 * </ConfirmButton>
 */
export function ConfirmButton({
  action,
  title,
  description,
  confirmLabel = "Delete",
  children,
  variant = "ghost",
  ...props
}: ButtonLook & {
  action: ButtonAction;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const { pending, run } = useRunAction(action, () => setOpen(false));

  return (
    <>
      <Button {...props} variant={variant} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={title} size="sm">
        <p className="text-sm text-muted">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="danger" onClick={run} disabled={pending} aria-busy={pending}>
            {pending && <LoaderCircle className="size-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </Modal>
    </>
  );
}
