"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActionForm, type FormAction } from "./action-form";
import { Button } from "./button";
import { SubmitButton } from "./submit-button";

/**
 * Modal built on the native <dialog> element: the browser handles the
 * focus trap, the Escape key and making the rest of the page inert.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      // A press that starts on the dialog element itself is on the backdrop. Using mousedown
      // (not click) means dragging a text selection out of the form cannot close it.
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      className={cn(
        "w-[calc(100%-2rem)] rounded-2xl border border-line bg-surface p-0 text-ink shadow-lift",
        "backdrop:bg-pine-950/50 backdrop:backdrop-blur-xs",
        "open:animate-rise",
        size === "sm" && "max-w-sm",
        size === "md" && "max-w-lg",
        size === "lg" && "max-w-2xl",
      )}
    >
      {open && (
        <div className="max-h-[85vh] overflow-y-auto p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="text-xl font-semibold">
                {title}
              </h2>
              {description && <p className="mt-1 text-sm text-muted">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-1 text-muted transition-colors hover:bg-pine-50 hover:text-ink focus-visible:outline-2 focus-visible:outline-pine-600"
            >
              <X className="size-5" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

/**
 * A button that opens a modal containing a form.
 * The modal closes by itself when the Server Action succeeds.
 *
 * <FormModal trigger="New club" title="Create club" action={createClub}>
 *   <TextField label="Name" name="name" required />
 * </FormModal>
 */
export function FormModal({
  trigger,
  triggerProps,
  title,
  description,
  action,
  submitLabel = "Save",
  size,
  children,
}: {
  trigger: ReactNode;
  triggerProps?: Omit<ComponentProps<typeof Button>, "onClick" | "children">;
  title: string;
  description?: string;
  action: FormAction;
  submitLabel?: string;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button {...triggerProps} onClick={() => setOpen(true)}>
        {trigger}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={title} description={description} size={size}>
        <ActionForm action={action} onSuccess={() => setOpen(false)} className="space-y-4">
          {children}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton>{submitLabel}</SubmitButton>
          </div>
        </ActionForm>
      </Modal>
    </>
  );
}
