"use client";

import { ActionForm, TextAreaField, type FormAction } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/submit-button";

export function CommentForm({ action }: { action: FormAction }) {
  return (
    <ActionForm action={action} resetOnSuccess className="mt-6 space-y-3 border-t border-line pt-5">
      <TextAreaField label="Add a comment" name="content" rows={3} maxLength={1000} required placeholder="Write something helpful..." />
      <div className="flex justify-end">
        <SubmitButton size="sm">Post comment</SubmitButton>
      </div>
    </ActionForm>
  );
}
