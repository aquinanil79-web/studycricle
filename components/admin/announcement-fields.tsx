import { SelectField, TextAreaField, TextField } from "@/components/ui/action-form";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/constants";
import type { Announcement } from "@/lib/types";

/**
 * Inputs shared by the "New" and "Edit" announcement modals.
 * The names and limits match announcementSchema in lib/validation.ts.
 */
export function AnnouncementFields({ announcement }: { announcement?: Announcement }) {
  return (
    <>
      <TextField
        label="Title"
        name="title"
        required
        minLength={3}
        maxLength={150}
        defaultValue={announcement?.title}
        placeholder="e.g. Mid-semester exam timetable released"
      />
      <SelectField
        label="Category"
        name="category"
        required
        options={ANNOUNCEMENT_CATEGORIES}
        defaultValue={announcement?.category ?? "General"}
      />
      <TextAreaField
        label="Content"
        name="content"
        rows={6}
        required
        minLength={10}
        maxLength={5000}
        defaultValue={announcement?.content}
      />
    </>
  );
}
