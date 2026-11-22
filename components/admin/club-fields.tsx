import { SelectField, TextAreaField, TextField } from "@/components/ui/action-form";
import { ImageUpload } from "@/components/ui/file-upload";
import { CLUB_CATEGORIES } from "@/lib/constants";
import type { Club } from "@/lib/types";

/**
 * Inputs of the "New club" and "Edit club" forms. Pass `club` to prefill them for editing.
 * The field names must match clubSchema in lib/validation.ts; the HTML limits mirror it.
 */
export function ClubFields({ club }: { club?: Club }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Name" name="name" defaultValue={club?.name} required minLength={3} maxLength={80} />
        <SelectField
          label="Category"
          name="category"
          options={CLUB_CATEGORIES}
          placeholder="Select a category"
          defaultValue={club?.category ?? ""}
          required
        />
      </div>
      <TextAreaField
        label="Description"
        name="description"
        defaultValue={club?.description}
        hint="At least 20 characters. What does the club do and who should join?"
        rows={5}
        required
        minLength={20}
        maxLength={1000}
      />
      <ImageUpload name="image_url" label="Cover image" bucket="images" folder="clubs" defaultValue={club?.image_url} />
    </>
  );
}
