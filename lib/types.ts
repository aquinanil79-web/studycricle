import type { Database } from "./database.types";

type Tables = Database["public"]["Tables"];

// Row types of the tables the pages work with.
export type Profile = Tables["profiles"]["Row"];
export type Club = Tables["clubs"]["Row"];
export type CampusEvent = Tables["events"]["Row"];
export type Announcement = Tables["announcements"]["Row"];
export type Resource = Tables["resources"]["Row"];

export type Role = "student" | "admin";

// What every Server Action returns, so forms and buttons can show a toast
// and per-field validation errors in one consistent way.
export type ActionState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string[] | undefined>;
} | null;
