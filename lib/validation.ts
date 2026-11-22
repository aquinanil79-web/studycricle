import * as z from "zod";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/constants";
import type { ActionState } from "@/lib/types";
import { isAllowedImageUrl } from "@/lib/utils";

// Validation schemas (Zod 4) used by Server Actions.
// The browser also validates with HTML attributes, but the server never trusts it.

// Optional text field: an empty input becomes null in the database.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer`)
    .transform((value) => value || null);

const imageUrl = optionalText(500).refine(
  (url) => url === null || isAllowedImageUrl(url),
  "Please upload the image with the image picker",
);

const requiredText = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be ${max} characters or fewer`);

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

const profileFields = {
  full_name: requiredText("Full name", 2, 80),
  student_id: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{4,15}$/, "Student ID must be 4-15 letters or digits"),
  department: z.string().trim().min(1, "Select a department"),
  year: z.coerce.number("Select a year").int().min(1, "Select a year").max(5, "Select a year"),
};

export const registerSchema = z
  .object({
    ...profileFields,
    email: z.email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    path: ["confirm_password"],
    error: "Passwords do not match",
  });

export const profileSchema = z.object({
  ...profileFields,
  // Optional here (staff such as the admin have no year); registration still requires it.
  year: z.literal("").transform(() => null).or(profileFields.year),
  bio: optionalText(500),
  avatar_url: imageUrl,
});

export const clubSchema = z.object({
  name: requiredText("Name", 3, 80),
  description: requiredText("Description", 20, 1000),
  category: z.string().trim().min(1, "Select a category"),
  image_url: imageUrl,
});

export const eventSchema = z.object({
  title: requiredText("Title", 3, 120),
  description: requiredText("Description", 20, 2000),
  event_date: z.iso.date("Choose a date"),
  event_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Choose a time"),
  location: requiredText("Location", 2, 120),
  organizer: requiredText("Organizer", 2, 120),
  capacity: z.coerce
    .number("Enter the maximum capacity")
    .int("Capacity must be a whole number")
    .min(1, "Capacity must be at least 1")
    .max(10000, "Capacity must be 10,000 or fewer"),
  image_url: imageUrl,
});

export const announcementSchema = z.object({
  title: requiredText("Title", 3, 150),
  content: requiredText("Content", 10, 5000),
  category: z.enum(ANNOUNCEMENT_CATEGORIES, "Select a category"),
});

export const resourceSchema = z.object({
  title: requiredText("Title", 3, 120),
  description: optionalText(500),
  subject: z.string().trim().min(1, "Select a subject"),
  file_path: z.string().min(1, "Choose a file to upload"),
  file_name: z.string().min(1).max(255),
  file_size: z.coerce.number().int().positive(),
  file_type: optionalText(150),
});

// Editing a resource changes its details only, never the file.
export const resourceDetailsSchema = resourceSchema.pick({
  title: true,
  description: true,
  subject: true,
});

export const commentSchema = z.object({
  content: requiredText("Comment", 1, 1000),
});

export const idSchema = z.uuid("Invalid id");

/**
 * Validates a submitted form against a schema.
 * Returns { data } when valid, otherwise { error } which the action returns as its state.
 */
export function parseForm<Schema extends z.ZodType>(
  schema: Schema,
  formData: FormData,
): { data: z.output<Schema>; error?: undefined } | { data?: undefined; error: NonNullable<ActionState> } {
  // Forms send line breaks as "\r\n"; make them "\n" so lengths match the browser's maxLength.
  const values = [...formData].map(([key, value]) => [key, typeof value === "string" ? value.replace(/\r\n/g, "\n") : value]);
  const result = schema.safeParse(Object.fromEntries(values));
  if (result.success) return { data: result.data };

  return {
    error: {
      ok: false,
      message: "Please fix the highlighted fields.",
      errors: z.flattenError(result.error).fieldErrors as Record<string, string[] | undefined>,
    },
  };
}
