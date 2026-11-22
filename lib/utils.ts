// Small helpers shared by server and client code. No dependencies.

/**
 * Profile and cover images use the app's authenticated media endpoint. Unsplash
 * remains permitted for the curated demo imagery already in the database.
 */
export function isAllowedImageUrl(url: string) {
  return url.startsWith("/api/media/") || url.startsWith("https://images.unsplash.com/");
}

/** Joins class names, skipping false/null/undefined: cn("a", isActive && "b") */
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// All dates are shown in Indian Standard Time so the server and the browser
// always render the same text (no hydration mismatch).
const TIME_ZONE = "Asia/Kolkata";

/** Today's date in India as YYYY-MM-DD. Used for "upcoming events" queries. */
export function todayInIndia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
}

/** Timestamp (ISO string) of `days` days ago, for "recent" queries. */
export function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/** "2026-10-14" or a timestamp -> "14 Oct 2026" */
export function formatDate(value: string) {
  // A date-only value has no time zone, so it is read and printed as UTC to keep the same day.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: dateOnly ? "UTC" : TIME_ZONE,
  }).format(new Date(dateOnly ? `${value}T00:00:00Z` : value));
}

/** "2026-10-14" -> { day: "14", month: "OCT", weekday: "Wed" } for calendar-style date tiles */
export function dateParts(date: string) {
  const parts = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    weekday: "short",
    timeZone: "UTC",
  }).formatToParts(new Date(`${date}T00:00:00Z`));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { day: get("day"), month: get("month").toUpperCase(), weekday: get("weekday") };
}

/** "14:30:00" -> "2:30 PM" */
export function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

/** Timestamp -> "5 minutes ago", "3 days ago"; falls back to the date after a month. */
export function timeAgo(timestamp: string) {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const units: [number, string][] = [
    [60, "minute"],
    [60, "hour"],
    [24, "day"],
  ];
  let value = seconds;
  let label = "";
  for (const [size, name] of units) {
    if (value < size) break;
    value = Math.floor(value / size);
    label = name;
  }
  if (label === "day" && value > 30) return formatDate(timestamp);
  return `${value} ${label}${value === 1 ? "" : "s"} ago`;
}

/** 1536000 -> "1.5 MB" */
export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Titles such as "Dr." are not part of a first name or of initials.
const HONORIFIC = /^(dr|prof|mr|mrs|ms|miss)\.?$/i;

function nameWords(name: string) {
  return name.trim().split(/\s+/).filter((word) => word && !HONORIFIC.test(word));
}

/** "Dr. Meera Iyer" -> "Meera" */
export function firstName(name: string) {
  return nameWords(name)[0] ?? "";
}

/** "Ananya Sharma" -> "AS", "Dr. Meera Iyer" -> "MI" */
export function initials(name: string) {
  const words = nameWords(name);
  if (words.length === 0) return "?";
  return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
}

/**
 * Turns user search text into an ilike pattern that is safe inside a Supabase .or() filter.
 * Commas, brackets and quotes would break the filter syntax, so they become "_", the
 * one-character wildcard, which still matches the original character.
 */
export function likePattern(text: string) {
  return `%${text.trim().replace(/[%_,()"\\]/g, "_")}%`;
}

/** Reads one value from searchParams, ignoring repeated params (?q=a&q=b). */
export function firstParam(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

/** Reads a count from an embedded Supabase count: select("*, club_members(count)") */
export function embeddedCount(value: { count: number }[] | null | undefined) {
  return value?.[0]?.count ?? 0;
}
