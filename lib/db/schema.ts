import { boolean, date, integer, pgTable, text, time, timestamp, uuid, smallint, bigint, customType } from "drizzle-orm/pg-core";
const bytea = customType<{ data: Buffer; driverData: Buffer }>({ dataType: () => "bytea" });

export const user = pgTable("user", {
  id: text("id").primaryKey(), name: text("name").notNull(), email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false), image: text("image"),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "string" }).notNull().defaultNow(), updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});
export const session = pgTable("session", {
  id: text("id").primaryKey(), expiresAt: timestamp("expiresAt", { withTimezone: true, mode: "string" }).notNull(), token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "string" }).notNull().defaultNow(), updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  ipAddress: text("ipAddress"), userAgent: text("userAgent"), userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
});
export const account = pgTable("account", {
  id: text("id").primaryKey(), accountId: text("accountId").notNull(), providerId: text("providerId").notNull(), userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"), refreshToken: text("refreshToken"), idToken: text("idToken"), accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { withTimezone: true, mode: "string" }),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", { withTimezone: true, mode: "string" }), scope: text("scope"), password: text("password"),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "string" }).notNull().defaultNow(), updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});
export const verification = pgTable("verification", {
  id: text("id").primaryKey(), identifier: text("identifier").notNull(), value: text("value").notNull(), expiresAt: timestamp("expiresAt", { withTimezone: true, mode: "string" }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "string" }).defaultNow(), updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "string" }).defaultNow(),
});
export const profiles = pgTable("profiles", {
  id: text("id").primaryKey(), full_name: text("full_name").notNull().default(""), email: text("email").notNull().unique(),
  student_id: text("student_id").unique(), department: text("department"), year: smallint("year"), bio: text("bio"), avatar_url: text("avatar_url"),
  role: text("role").notNull().default("student"), created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(), updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});
export const clubs = pgTable("clubs", {
  id: uuid("id").defaultRandom().primaryKey(), name: text("name").notNull().unique(), description: text("description").notNull(), category: text("category").notNull(),
  image_url: text("image_url"), created_by: text("created_by"), created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(), updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});
export const club_members = pgTable("club_members", { id: uuid("id").defaultRandom().primaryKey(), club_id: uuid("club_id").notNull(), user_id: text("user_id").notNull(), joined_at: timestamp("joined_at", { withTimezone: true, mode: "string" }).notNull().defaultNow() });
export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(), title: text("title").notNull(), description: text("description").notNull(), event_date: date("event_date").notNull(), event_time: time("event_time").notNull(), location: text("location").notNull(),
  organizer: text("organizer").notNull(), capacity: integer("capacity").notNull(), image_url: text("image_url"), created_by: text("created_by"), created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(), updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});
export const event_registrations = pgTable("event_registrations", { id: uuid("id").defaultRandom().primaryKey(), event_id: uuid("event_id").notNull(), user_id: text("user_id").notNull(), registered_at: timestamp("registered_at", { withTimezone: true, mode: "string" }).notNull().defaultNow() });
export const announcements = pgTable("announcements", {
  id: uuid("id").defaultRandom().primaryKey(), title: text("title").notNull(), content: text("content").notNull(), category: text("category").notNull().default("General"), author_id: text("author_id"),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(), updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});
export const resources = pgTable("resources", {
  id: uuid("id").defaultRandom().primaryKey(), title: text("title").notNull(), description: text("description"), subject: text("subject").notNull(), file_path: text("file_path").notNull().unique(), file_name: text("file_name").notNull(),
  file_size: bigint("file_size", { mode: "number" }).notNull(), file_type: text("file_type"), uploaded_by: text("uploaded_by").notNull(), created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});
export const comments = pgTable("comments", { id: uuid("id").defaultRandom().primaryKey(), content: text("content").notNull(), author_id: text("author_id").notNull(), club_id: uuid("club_id"), event_id: uuid("event_id"), created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow() });
export const media_objects = pgTable("media_objects", { id: uuid("id").defaultRandom().primaryKey(), owner_id: text("owner_id"), category: text("category").notNull(), file_name: text("file_name").notNull(), content_type: text("content_type").notNull(), file_size: bigint("file_size", { mode: "number" }).notNull(), data: bytea("data").notNull(), is_public: boolean("is_public").notNull().default(false), created_at: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow() });
