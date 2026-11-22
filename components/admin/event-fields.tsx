import { TextAreaField, TextField } from "@/components/ui/action-form";
import { ImageUpload } from "@/components/ui/file-upload";
import type { CampusEvent } from "@/lib/types";

/**
 * Inputs of the "New event" and "Edit event" forms. Pass `event` to prefill them for editing.
 * The field names must match eventSchema in lib/validation.ts; the HTML limits mirror it.
 */
export function EventFields({ event }: { event?: CampusEvent }) {
  return (
    <>
      <TextField label="Title" name="title" defaultValue={event?.title} required minLength={3} maxLength={120} />
      <TextAreaField
        label="Description"
        name="description"
        defaultValue={event?.description}
        hint="At least 20 characters. What will happen and who is it for?"
        rows={5}
        required
        minLength={20}
        maxLength={2000}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="Date" name="event_date" type="date" defaultValue={event?.event_date} required />
        {/* The database stores "14:30:00"; a time input expects "14:30". */}
        <TextField label="Time" name="event_time" type="time" defaultValue={event?.event_time.slice(0, 5)} required />
        <TextField
          label="Capacity"
          name="capacity"
          type="number"
          inputMode="numeric"
          defaultValue={event?.capacity}
          required
          min={1}
          max={10000}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Location" name="location" defaultValue={event?.location} required minLength={2} maxLength={120} />
        <TextField
          label="Organizer"
          name="organizer"
          defaultValue={event?.organizer}
          placeholder="e.g. Robotics Club"
          required
          minLength={2}
          maxLength={120}
        />
      </div>
      <ImageUpload name="image_url" label="Cover image" bucket="images" folder="events" defaultValue={event?.image_url} />
    </>
  );
}
