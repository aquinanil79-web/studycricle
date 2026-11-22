"use server";

import { and, count, eq, gte, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { comments, event_registrations, events } from "@/lib/db/schema";
import type { ActionState } from "@/lib/types";
import { todayInIndia } from "@/lib/utils";
import { eventSchema, idSchema, parseForm } from "@/lib/validation";
import { failed, succeeded, UNIQUE_VIOLATION } from "./result";

function refreshEventPages(eventId?: string) {
  revalidatePath("/events");
  if (eventId) revalidatePath(`/events/${eventId}`);
  revalidatePath("/dashboard");
  revalidatePath("/admin/events");
  revalidatePath("/");
}

export async function registerForEvent(eventId: string): Promise<ActionState> {
  const user = await requireUser();
  if (!idSchema.safeParse(eventId).success) return { ok: false, message: "Invalid event." };
  try {
    await db.transaction(async (tx) => {
      const [event] = await tx.select().from(events).where(eq(events.id, eventId)).for("update");
      if (!event) throw new Error("EVENT_MISSING");
      if (event.event_date < todayInIndia()) throw new Error("EVENT_PAST");
      const [{ total }] = await tx.select({ total: count() }).from(event_registrations).where(eq(event_registrations.event_id, eventId));
      if (total >= event.capacity) throw new Error("EVENT_FULL");
      await tx.insert(event_registrations).values({ event_id: eventId, user_id: user.id });
    });
  } catch (cause) {
    const code = (cause as { code?: string }).code;
    const message = cause instanceof Error ? cause.message : "";
    if (code === UNIQUE_VIOLATION) return { ok: false, message: "You are already registered for this event." };
    if (message === "EVENT_MISSING") return { ok: false, message: "This event no longer exists." };
    if (message === "EVENT_PAST") return { ok: false, message: "This event has already taken place." };
    if (message === "EVENT_FULL") return { ok: false, message: "Sorry, this event is full." };
    return failed({ message: String(cause) }, "Could not register for the event.");
  }
  refreshEventPages(eventId);
  return succeeded("You're registered! See you there.");
}

export async function cancelRegistration(eventId: string): Promise<ActionState> {
  const user = await requireUser();
  if (!idSchema.safeParse(eventId).success) return { ok: false, message: "Invalid event." };
  await db.delete(event_registrations).where(and(eq(event_registrations.event_id, eventId), eq(event_registrations.user_id, user.id)));
  refreshEventPages(eventId);
  return succeeded("Registration cancelled.");
}

export async function createEvent(_state: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const { data, error } = parseForm(eventSchema, formData);
  if (error) return error;
  await db.insert(events).values({ ...data, created_by: admin.id });
  refreshEventPages();
  return succeeded(`"${data.title}" created.`);
}

export async function updateEvent(eventId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  if (!idSchema.safeParse(eventId).success) return { ok: false, message: "Invalid event." };
  const { data, error } = parseForm(eventSchema, formData);
  if (error) return error;
  const [{ total }] = await db.select({ total: count() }).from(event_registrations).where(eq(event_registrations.event_id, eventId));
  if (data.capacity < total) {
    const message = `${total} students are already registered, so capacity must be at least ${total}.`;
    return { ok: false, message, errors: { capacity: [message] } };
  }
  await db.update(events).set(data).where(eq(events.id, eventId));
  refreshEventPages(eventId);
  return succeeded(`"${data.title}" updated.`);
}

export async function deleteEvent(eventId: string): Promise<ActionState> {
  await requireAdmin();
  if (!idSchema.safeParse(eventId).success) return { ok: false, message: "Invalid event." };
  await db.transaction(async (tx) => {
    await tx.delete(comments).where(eq(comments.event_id, eventId));
    await tx.delete(event_registrations).where(eq(event_registrations.event_id, eventId));
    await tx.delete(events).where(eq(events.id, eventId));
  });
  refreshEventPages(eventId);
  return succeeded("Event deleted.");
}
