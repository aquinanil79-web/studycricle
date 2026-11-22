import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, CalendarX, CircleCheck, Clock, MapPin, Ticket, UserRound, Users } from "lucide-react";
import { Comments } from "@/components/comments";
import { SeatsBadge } from "@/components/event-card";
import { ActionButton, ConfirmButton } from "@/components/ui/action-button";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { CoverImage } from "@/components/ui/cover-image";
import { cancelRegistration, registerForEvent } from "@/lib/actions/events";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { event_registrations, events, profiles } from "@/lib/db/schema";
import { and, count, desc, eq } from "drizzle-orm";
import { cn, dateParts, embeddedCount, formatDate, formatTime, todayInIndia } from "@/lib/utils";
import { idSchema } from "@/lib/validation";

const SHOWN_ATTENDEES = 8;

async function getEvent(id: string) {
  if (!idSchema.safeParse(id).success) return null;
  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!event) return null;
  const [{ value: registrationCount }] = await db.select({ value: count() }).from(event_registrations).where(eq(event_registrations.event_id, id));
  return { ...event, event_registrations: [{ count: registrationCount }] };
}

export async function generateMetadata({ params }: PageProps<"/events/[id]">): Promise<Metadata> {
  const event = await getEvent((await params).id);
  return { title: event?.title ?? "Event not found" };
}

export default async function EventPage({ params }: PageProps<"/events/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const [attendees, [myRegistration]] = await Promise.all([
    db.select({ user_id: event_registrations.user_id, attendee: { full_name: profiles.full_name, avatar_url: profiles.avatar_url, department: profiles.department } })
      .from(event_registrations).leftJoin(profiles, eq(event_registrations.user_id, profiles.id))
      .where(eq(event_registrations.event_id, event.id)).orderBy(desc(event_registrations.registered_at)).limit(SHOWN_ATTENDEES),
    db.select({ id: event_registrations.id }).from(event_registrations).where(and(eq(event_registrations.event_id, event.id), eq(event_registrations.user_id, user.id))).limit(1),
  ]);
  const isRegistered = Boolean(myRegistration);

  const registrations = embeddedCount(event.event_registrations);
  const seatsLeft = Math.max(event.capacity - registrations, 0);
  const filled = Math.min(Math.round((registrations / event.capacity) * 100), 100);
  // Same rule as the registerForEvent action: an event is past from the day after it.
  const isPast = event.event_date < todayInIndia();

  const details = [
    { icon: CalendarDays, label: "Date", value: `${dateParts(event.event_date).weekday}, ${formatDate(event.event_date)}` },
    { icon: Clock, label: "Time", value: formatTime(event.event_time) },
    { icon: MapPin, label: "Location", value: event.location },
    { icon: UserRound, label: "Organizer", value: event.organizer },
    { icon: Users, label: "Capacity", value: `${event.capacity} seats` },
  ];

  return (
    <>
      <Link href="/events" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> All events
      </Link>

      <Card className="animate-rise overflow-hidden">
        <CoverImage
          src={event.image_url}
          alt={event.title}
          icon={CalendarDays}
          preload
          sizes="(min-width: 1280px) 1200px, 100vw"
          className="aspect-[21/9] max-h-80 w-full"
        />
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_20rem]">
          <div>
            <SeatsBadge event={event} registrations={registrations} registered={Boolean(isRegistered)} />
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{event.title}</h1>
            <p className="mt-2 text-muted">Organised by {event.organizer}</p>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              {details.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-pine-50 text-pine-700">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <dt className="eyebrow text-muted">{label}</dt>
                    <dd className="mt-0.5 font-medium break-words">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          {/* Capacity meter and the register / cancel button. */}
          <div className="self-start rounded-2xl border border-line bg-paper p-5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="eyebrow text-muted">Seats</p>
              <p className="text-sm text-muted">
                <span className="font-display text-2xl font-semibold text-ink">{registrations}</span> / {event.capacity}
              </p>
            </div>
            <div
              role="progressbar"
              aria-label="Seats taken"
              aria-valuemin={0}
              aria-valuemax={event.capacity}
              aria-valuenow={registrations}
              className="mt-3 h-2.5 overflow-hidden rounded-full bg-ink/8"
            >
              <div
                className={cn(
                  "h-full rounded-full",
                  seatsLeft === 0 ? "bg-brick-500" : filled >= 80 ? "bg-marigold-400" : "bg-pine-500",
                )}
                style={{ width: `${filled}%` }}
              />
            </div>
            <p className={cn("mt-2 text-sm font-medium", seatsLeft === 0 ? "text-brick-600" : "text-pine-700")}>
              {seatsLeft === 0 ? "Event full" : `${seatsLeft} seat${seatsLeft === 1 ? "" : "s"} left`}
            </p>

            <div className="mt-5 border-t border-line pt-5">
              {isPast ? (
                <p className="flex items-center gap-2 text-sm font-medium text-muted">
                  <CalendarX className="size-5 shrink-0" /> This event has ended
                </p>
              ) : isRegistered ? (
                <div className="space-y-3">
                  <p className="flex items-start gap-2 rounded-xl bg-pine-100 px-4 py-3 text-sm text-pine-900">
                    <CircleCheck className="mt-0.5 size-5 shrink-0 text-pine-700" />
                    <span>
                      <span className="block font-semibold">You&apos;re registered</span>
                      See you on {formatDate(event.event_date)} at {formatTime(event.event_time)}.
                    </span>
                  </p>
                  <ConfirmButton
                    action={cancelRegistration.bind(null, event.id)}
                    title="Cancel your registration?"
                    description="Your seat will be given up. You can register again while seats are left."
                    confirmLabel="Cancel registration"
                    variant="outline"
                    className="w-full"
                  >
                    Cancel registration
                  </ConfirmButton>
                </div>
              ) : seatsLeft === 0 ? (
                <Button variant="outline" size="lg" disabled className="w-full">
                  Event full
                </Button>
              ) : (
                <ActionButton action={registerForEvent.bind(null, event.id)} variant="accent" size="lg" className="w-full">
                  <Ticket className="size-4" /> Register now
                </ActionButton>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold">About the event</h2>
            <p className="mt-3 leading-relaxed whitespace-pre-line text-ink/85">{event.description}</p>
          </Card>
          <Comments target="event" targetId={event.id} />
        </div>

        <Card className="self-start">
          <CardHeader
            title="Who's going"
            description={registrations ? `${registrations} registered, most recent first` : undefined}
          />
          {attendees?.length ? (
            <ul className="divide-y divide-line" role="list">
              {attendees.map(({ user_id, attendee }) => (
                <li key={user_id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={attendee?.full_name || "Student"} src={attendee?.avatar_url} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {attendee?.full_name || "Student"}
                      {user_id === user.id && <span className="text-muted"> (you)</span>}
                    </p>
                    {attendee?.department && <p className="truncate text-xs text-muted">{attendee.department}</p>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 text-sm text-muted">
              {isPast ? "Nobody registered for this event." : "No one has registered yet. Be the first!"}
            </p>
          )}
          {registrations > SHOWN_ATTENDEES && (
            <p className="border-t border-line px-5 py-3 text-xs text-muted">+{registrations - SHOWN_ATTENDEES} more</p>
          )}
        </Card>
      </div>
    </>
  );
}
