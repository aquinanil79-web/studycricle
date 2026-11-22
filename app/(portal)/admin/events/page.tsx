import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Pencil, Plus, Trash } from "lucide-react";
import { EventFields } from "@/components/admin/event-fields";
import { ConfirmButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormModal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { SearchFilter } from "@/components/ui/search-filter";
import { createEvent, deleteEvent, updateEvent } from "@/lib/actions/events";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { event_registrations, events } from "@/lib/db/schema";
import { and, asc, count, desc, eq, gte, ilike, lt, or } from "drizzle-orm";
import { cn, embeddedCount, firstParam, formatDate, formatTime, todayInIndia } from "@/lib/utils";

export const metadata: Metadata = { title: "Manage events" };

// The empty choice of the "show" dropdown means all events, so admins see everything by default.
const SHOW_OPTIONS = ["Upcoming", "Past"] as const;

const statusTones = { Upcoming: "pine", Full: "rose", Past: "neutral" } as const;

const th = "eyebrow px-5 py-3 text-muted";

export default async function AdminEventsPage({ searchParams }: PageProps<"/admin/events">) {
  await requireAdmin();
  const params = await searchParams;
  const q = firstParam(params.q);
  const show = SHOW_OPTIONS.find((option) => option === firstParam(params.show)) ?? "";
  const today = todayInIndia();

  // Upcoming events: soonest first. Past and all events: latest date first.
  const ascending = show === "Upcoming";
  const filters = [
    q ? or(ilike(events.title, `%${q}%`), ilike(events.organizer, `%${q}%`), ilike(events.location, `%${q}%`)) : undefined,
    show === "Upcoming" ? gte(events.event_date, today) : undefined,
    show === "Past" ? lt(events.event_date, today) : undefined,
  ].filter(Boolean);
  const [eventRows, registrationCounts] = await Promise.all([
    db.select().from(events).where(and(...filters)).orderBy(ascending ? asc(events.event_date) : desc(events.event_date), ascending ? asc(events.event_time) : desc(events.event_time)),
    db.select({ event_id: event_registrations.event_id, count: count() }).from(event_registrations).groupBy(event_registrations.event_id),
  ]);
  const counts = new Map(registrationCounts.map((row) => [row.event_id, row.count]));
  const eventList = eventRows.map((event) => ({ ...event, event_registrations: [{ count: counts.get(event.id) ?? 0 }] }));

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Manage events"
        description="Schedule events, track registrations against capacity and update or cancel events."
        action={
          <FormModal
            trigger={
              <>
                <Plus className="size-4" /> New event
              </>
            }
            title="New event"
            description="Students can register as soon as it is created."
            action={createEvent}
            submitLabel="Create event"
            size="lg"
          >
            <EventFields />
          </FormModal>
        }
      />
      <SearchFilter
        action="/admin/events"
        query={q}
        placeholder="Search by title, organizer or location"
        filter={{ name: "show", label: "All events", value: show, options: SHOW_OPTIONS }}
      />

      {eventList.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={q || show ? "No events match your search" : "No events yet"}
          description={q || show ? "Try a different search term or filter." : "Create the first event with the New event button."}
        />
      ) : (
        <Card className="animate-rise overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-3xl text-left text-sm">
              <caption className="sr-only">Events</caption>
              <thead className="border-b border-line bg-paper/60">
                <tr>
                  <th scope="col" className={th}>Event</th>
                  <th scope="col" className={th}>Date &amp; time</th>
                  <th scope="col" className={th}>Location</th>
                  <th scope="col" className={th}>Registrations</th>
                  <th scope="col" className={th}>Status</th>
                  <th scope="col" className={th}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {eventList.map((event) => {
                  const registrations = embeddedCount(event.event_registrations);
                  const full = registrations >= event.capacity;
                  // Same rule as registerForEvent: an event taking place today is still upcoming.
                  const status = event.event_date < today ? "Past" : full ? "Full" : "Upcoming";

                  return (
                    <tr key={event.id} className="transition-colors hover:bg-pine-50/50">
                      <td className="max-w-xs px-5 py-3">
                        <Link
                          href={`/events/${event.id}`}
                          className="rounded-sm font-semibold text-ink hover:text-pine-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine-600"
                        >
                          {event.title}
                        </Link>
                        <p className="truncate text-xs text-muted">by {event.organizer}</p>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <p className="font-medium">{formatDate(event.event_date)}</p>
                        <p className="text-xs text-muted">{formatTime(event.event_time)}</p>
                      </td>
                      <td className="px-5 py-3 text-muted">{event.location}</td>
                      <td className="px-5 py-3">
                        <p className="whitespace-nowrap tabular-nums">
                          <span className="font-semibold">{registrations}</span>
                          <span className="text-muted"> / {event.capacity}</span>
                        </p>
                        <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-ink/8">
                          <div
                            className={cn("h-full rounded-full", full ? "bg-brick-500" : "bg-pine-500")}
                            style={{ width: `${Math.min(100, (registrations / event.capacity) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={statusTones[status]}>{status}</Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1">
                          <FormModal
                            trigger={<Pencil className="size-4" />}
                            triggerProps={{ variant: "ghost", size: "sm", "aria-label": `Edit ${event.title}` }}
                            title="Edit event"
                            description={event.title}
                            action={updateEvent.bind(null, event.id)}
                            submitLabel="Save changes"
                            size="lg"
                          >
                            <EventFields event={event} />
                          </FormModal>
                          <ConfirmButton
                            action={deleteEvent.bind(null, event.id)}
                            title={`Delete ${event.title}?`}
                            description="All registrations and comments of this event will be removed too. This cannot be undone."
                            confirmLabel="Delete event"
                            size="sm"
                            className="text-muted hover:text-brick-600"
                            aria-label={`Delete ${event.title}`}
                          >
                            <Trash className="size-4" />
                          </ConfirmButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
