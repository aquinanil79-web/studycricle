import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { EventCard } from "@/components/event-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SearchFilter } from "@/components/ui/search-filter";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { event_registrations, events } from "@/lib/db/schema";
import { and, asc, count, desc, eq, gte, ilike, lt, or } from "drizzle-orm";
import { dateParts, embeddedCount, firstParam, todayInIndia } from "@/lib/utils";

export const metadata: Metadata = { title: "Events" };

// The empty filter value ("") means upcoming events, so these are the only other choices.
const SHOW_OPTIONS = ["Past events", "All events"] as const;

const EMPTY_TITLES = {
  "": "No upcoming events",
  "Past events": "No past events",
  "All events": "No events yet",
};

export default async function EventsPage({ searchParams }: PageProps<"/events">) {
  const user = await requireUser();
  const params = await searchParams;
  const q = firstParam(params.q);
  // Anything unknown in the URL falls back to upcoming events.
  const show = SHOW_OPTIONS.find((option) => option === firstParam(params.show)) ?? "";

  // Upcoming and all events read like a calendar (soonest first); past events show the latest first.
  const ascending = show !== "Past events";
  const today = todayInIndia();

  const conditions = [
    show === "" ? gte(events.event_date, today) : undefined,
    show === "Past events" ? lt(events.event_date, today) : undefined,
    q ? or(ilike(events.title, `%${q}%`), ilike(events.description, `%${q}%`), ilike(events.location, `%${q}%`), ilike(events.organizer, `%${q}%`)) : undefined,
  ].filter(Boolean);
  const [eventRows, registrationCounts, registrations] = await Promise.all([
    db.select().from(events).where(and(...conditions)).orderBy(ascending ? asc(events.event_date) : desc(events.event_date), ascending ? asc(events.event_time) : desc(events.event_time)),
    db.select({ event_id: event_registrations.event_id, count: count() }).from(event_registrations).groupBy(event_registrations.event_id),
    db.select({ event_id: event_registrations.event_id }).from(event_registrations).where(eq(event_registrations.user_id, user.id)),
  ]);
  const countByEvent = new Map(registrationCounts.map((row) => [row.event_id, row.count]));
  const eventList = eventRows.map((event) => ({ ...event, event_registrations: [{ count: countByEvent.get(event.id) ?? 0 }] }));
  const registered = new Set(registrations.map((registration) => registration.event_id));

  // Group the already sorted events by month ("2026-10") for the month headings.
  const months = new Map<string, typeof eventList>();
  for (const event of eventList) {
    const key = event.event_date.slice(0, 7);
    const group = months.get(key) ?? [];
    group.push(event);
    months.set(key, group);
  }

  return (
    <>
      <PageHeader
        eyebrow="What's on"
        title="Campus events"
        description="Workshops, fests, talks and meetups happening around campus. Register early to save your seat."
      />
      <SearchFilter
        action="/events"
        query={q}
        placeholder="Search by title, venue or organizer"
        filter={{ name: "show", label: "Upcoming events", value: show, options: SHOW_OPTIONS }}
      />

      {eventList.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={q ? "No events match your search" : EMPTY_TITLES[show]}
          description={
            q
              ? "Try a different search term, or look in past or all events."
              : "New events will appear here as soon as they are announced."
          }
        />
      ) : (
        <div className="space-y-10">
          {[...months].map(([month, monthEvents]) => (
            <section key={month}>
              <h2 className="eyebrow mb-4 flex items-center gap-3 font-sans text-pine-700">
                {dateParts(`${month}-01`).month} {month.slice(0, 4)}
                <span className="h-px flex-1 bg-line" />
              </h2>
              <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" role="list">
                {monthEvents.map((event, index) => (
                  <li key={event.id} className="animate-rise" style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
                    <EventCard
                      event={event}
                      registrations={embeddedCount(event.event_registrations)}
                      registered={registered.has(event.id)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
