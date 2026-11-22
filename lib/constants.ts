export const APP_NAME = "StudyCircle";

export const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Artificial Intelligence & Data Science",
  "Business Administration",
] as const;

export const YEARS = [
  { value: 1, label: "1st Year" },
  { value: 2, label: "2nd Year" },
  { value: 3, label: "3rd Year" },
  { value: 4, label: "4th Year" },
  { value: 5, label: "5th Year" },
] as const;

export const CLUB_CATEGORIES = [
  "Technical",
  "Cultural",
  "Sports",
  "Literary",
  "Social Service",
  "Entrepreneurship",
] as const;

// Must match the check constraint on announcements.category in supabase/schema.sql.
export const ANNOUNCEMENT_CATEGORIES = [
  "General",
  "Academic",
  "Examination",
  "Placement",
  "Event",
] as const;

export const RESOURCE_SUBJECTS = [
  "Data Structures & Algorithms",
  "Database Management Systems",
  "Operating Systems",
  "Computer Networks",
  "Web Development",
  "Machine Learning",
  "Engineering Mathematics",
  "Digital Electronics",
  "Placement Preparation",
  "Other",
] as const;

// Storage buckets created in supabase/schema.sql, with the same size limits.
export const BUCKETS = {
  avatars: { name: "avatars", maxSizeMB: 2, accept: "image/png,image/jpeg,image/webp" },
  images: { name: "images", maxSizeMB: 5, accept: "image/png,image/jpeg,image/webp" },
  resources: {
    name: "resources",
    maxSizeMB: 10,
    accept: ".pdf,.txt,.png,.jpg,.jpeg,.doc,.docx,.ppt,.pptx,.xls,.xlsx",
  },
} as const;

export type BucketName = keyof typeof BUCKETS;
