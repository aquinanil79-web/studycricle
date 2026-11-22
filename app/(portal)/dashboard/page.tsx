import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, FileText, Megaphone, Shield, Ticket, Users } from "lucide-react";
import { DateTile, EventCard } from "@/components/event-card";
import { Avatar } from "@/components/ui/avatar";
import { CategoryBadge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { requireUser } from "@/lib/auth";
import { YEARS } from "@/lib/constants";
import { db } from "@/lib/db";
import { announcements as announcementsTable, club_members, event_registrations, events, profiles, resources as resourcesTable, clubs as clubsTable } from "@/lib/db/schema";
import { and, asc, count, desc, eq, gte } from "drizzle-orm";
import { dateParts, embeddedCount, firstName, formatDate, formatTime, timeAgo, todayInIndia } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

// Greeting by the current hour in India, the time zone every date on the site uses.
function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-IN", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(new Date()),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// "View all" link for the right side of a card header.
function ViewAll({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex shrink-0 items-center gap-1 rounded-md text-sm font-semibold text-pine-700 hover:text-pine-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine-600"
    >
      View all <ArrowRight className="size-4" />
    </Link>
  );
}

// Row style shared by the compact lists (registered events, clubs).
const rowLink =
  "flex items-center gap-3 px-5 py-3 transition-colors hover:bg-pine-50/70 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-pine-600";

export default async function DashboardPage() {
  const user = await requireUser();
  const today = todayInIndia();
  const [clubRows, clubTotalRows, upcomingRows, upcomingTotalRows, eventRegistrationCounts, registrationRows, announcementRows, resourceRows, resourceTotalRows] = await Promise.all([
    db.select({ club: { id: clubsTable.id, name: clubsTable.name, category: clubsTable.category, image_url: clubsTable.image_url }, joined_at: club_members.joined_at })
      .from(club_members).innerJoin(clubsTable, eq(club_members.club_id, clubsTable.id)).where(eq(club_members.user_id, user.id)).orderBy(desc(club_members.joined_at)).limit(5),
    db.select({ value: count() }).from(club_members).where(eq(club_members.user_id, user.id)),
    db.select().from(events).where(gte(events.event_date, today)).orderBy(asc(events.event_date), asc(events.event_time)).limit(4),
    db.select({ value: count() }).from(events).where(gte(events.event_date, today)),
    db.select({ event_id: event_registrations.event_id, count: count() }).from(event_registrations).groupBy(event_registrations.event_id),
    db.select({ event: events }).from(event_registrations).innerJoin(events, eq(event_registrations.event_id, events.id)).where(eq(event_registrations.user_id, user.id)),
    db.select({ id: announcementsTable.id, title: announcementsTable.title, category: announcementsTable.category, created_at: announcementsTable.created_at }).from(announcementsTable).orderBy(desc(announcementsTable.created_at)).limit(4),
    db.select({ id: resourcesTable.id, title: resourcesTable.title, subject: resourcesTable.subject, created_at: resourcesTable.created_at, uploader: { full_name: profiles.full_name } })
      .from(resourcesTable).leftJoin(profiles, eq(resourcesTable.uploaded_by, profiles.id)).orderBy(desc(resourcesTable.created_at)).limit(5),
    db.select({ value: count() }).from(resourcesTable),
  ]);
  const [clubTotal] = clubTotalRows;
  const [upcomingTotal] = upcomingTotalRows;
  const [resourceTotal] = resourceTotalRows;
  const registrationList = registrationRows;
  const registrationPayload = { data: registrationList };
  const clubsPayload = { data: clubRows, count: clubTotal?.value ?? 0 };
  const registrationCountByEvent = new Map(eventRegistrationCounts.map((row) => [row.event_id, row.count]));
  const upcomingPayload = { data: upcomingRows.map((event) => ({ ...event, event_registrations: [{ count: registrationCountByEvent.get(event.id) ?? 0 }] })), count: upcomingTotal?.value ?? 0 };
  const announcementsPayload = { data: announcementRows };
  const resourcesPayload = { data: resourceRows, count: resourceTotal?.value ?? 0 };
  const clubs = clubsPayload;
  const upcoming = upcomingPayload;
  const registrations = registrationPayload;
  const announcements = announcementsPayload;
  const resources = resourcesPayload;

  const registeredEvents = (registrations.data ?? [])
    .map((registration) => registration.event)
    .filter((event) => event.event_date >= today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date) || a.event_time.localeCompare(b.event_time));
  const registeredIds = new Set(registeredEvents.map((event) => event.id));
  const upcomingEvents = upcoming.data ?? [];
  const myClubs = clubs.data ?? [];

  const name = firstName(user.full_name);
  const yearLabel = YEARS.find((year) => year.value === user.year)?.label;
  const details = [user.department, yearLabel].filter(Boolean).join(" · ");

  const stats = [
    { label: "Clubs joined", value: clubs.count ?? 0, icon: Users, tone: "pine", hint: "Your communities" },
    { label: "Upcoming events", value: upcoming.count ?? 0, icon: CalendarDays, tone: "marigold", hint: "From today onwards" },
    {
      label: "Event registrations",
      value: registeredEvents.length,
      icon: Ticket,
      tone: "sky",
      hint: `${registrations.data?.length ?? 0} in total`,
    },
    { label: "Available resources", value: resources.count ?? 0, icon: BookOpen, tone: "rose", hint: "Shared study material" },
  ] as const;

  return (
    <>
      <PageHeader
        eyebrow={`${dateParts(today).weekday}, ${formatDate(today)}`}
        title={name ? `${greeting()}, ${name}` : greeting()}
        description={details || "Learn together. Compete together. Grow together."}
        action={
          <Link href="/profile" aria-label="View your profile" className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine-600">
            <Avatar name={user.full_name || user.email} src={user.avatar_url} size="lg" />
          </Link>
        }
      />

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" role="list">
        {stats.map((stat, index) => (
          <li key={stat.label} className="animate-rise" style={{ animationDelay: `${index * 60}ms` }}>
            <StatCard {...stat} />
          </li>
        ))}
      </ul>

      {user.role === "admin" && (
        <Link
          href="/admin"
          className="mt-6 flex animate-rise items-center gap-4 rounded-2xl bg-pine-900 p-5 text-paper shadow-card transition-colors hover:bg-pine-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine-600"
          style={{ animationDelay: "240ms" }}
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-marigold-400 text-pine-950">
            <Shield className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Admin panel</span>
            <span className="block text-sm text-pine-200">Manage students, clubs, events, announcements and resources.</span>
          </span>
          <ArrowRight className="size-5 shrink-0 text-marigold-300" />
        </Link>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section aria-labelledby="upcoming-heading" className="animate-rise" style={{ animationDelay: "240ms" }}>
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 id="upcoming-heading" className="text-xl font-semibold">
                Upcoming events
              </h2>
              <ViewAll href="/events" label="View all events" />
            </div>
            {upcomingEvents.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No upcoming events"
                description="New events from the college will show up here."
              />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2" role="list">
                {upcomingEvents.map((event) => (
                  <li key={event.id}>
                    <EventCard
                      event={event}
                      registrations={embeddedCount(event.event_registrations)}
                      registered={registeredIds.has(event.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Card className="animate-rise" style={{ animationDelay: "300ms" }}>
            <CardHeader
              title="Recent announcements"
              description="Latest notices from the college"
              action={<ViewAll href="/announcements" label="View all announcements" />}
            />
            {announcements.data?.length ? (
              <ul className="divide-y divide-line" role="list">
                {announcements.data.map((announcement) => (
                  <li key={announcement.id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <CategoryBadge category={announcement.category} />
                      <time dateTime={announcement.created_at} className="text-xs text-muted">
                        {timeAgo(announcement.created_at)}
                      </time>
                    </div>
                    <p className="mt-1.5 line-clamp-2 font-medium">{announcement.title}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-5">
                <EmptyState icon={Megaphone} title="No announcements yet" description="Notices from the college will appear here." />
              </div>
            )}
          </Card>

          <Card className="animate-rise" style={{ animationDelay: "360ms" }}>
            <CardHeader
              title="Recently uploaded resources"
              description="Notes and papers shared by students"
              action={<ViewAll href="/resources" label="View all resources" />}
            />
            {resources.data?.length ? (
              <ul className="divide-y divide-line" role="list">
                {resources.data.map((resource) => (
                  <li key={resource.id} className="flex items-center gap-3 px-5 py-3.5">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-marigold-100 text-marigold-700">
                      <FileText className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{resource.title}</p>
                      <p className="truncate text-xs text-muted">
                        {resource.subject} · by {resource.uploader?.full_name || "a student"}
                      </p>
                    </div>
                    <time dateTime={resource.created_at} className="shrink-0 text-xs text-muted">
                      {timeAgo(resource.created_at)}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-5">
                <EmptyState icon={BookOpen} title="No resources yet" description="Study material shared by students will appear here." />
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="animate-rise" style={{ animationDelay: "300ms" }}>
            <CardHeader
              title="My registered events"
              description={registeredEvents.length ? `${registeredEvents.length} coming up` : undefined}
              action={<ViewAll href="/events" label="View all events" />}
            />
            {registeredEvents.length ? (
              <ul className="divide-y divide-line" role="list">
                {registeredEvents.slice(0, 4).map((event) => (
                  <li key={event.id}>
                    <Link href={`/events/${event.id}`} className={rowLink}>
                      <DateTile date={event.event_date} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{event.title}</p>
                        <p className="truncate text-xs text-muted">
                          {formatTime(event.event_time)} · {event.location}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-5">
                <EmptyState
                  icon={Ticket}
                  title="No registrations yet"
                  description="Register for an event and it will show up here."
                  action={
                    <Link href="/events" className={buttonStyles({ variant: "outline", size: "sm" })}>
                      Browse events
                    </Link>
                  }
                />
              </div>
            )}
          </Card>

          <Card className="animate-rise" style={{ animationDelay: "360ms" }}>
            <CardHeader
              title="My clubs"
              description={clubs.count ? `Member of ${clubs.count}` : undefined}
              action={<ViewAll href="/clubs" label="View all clubs" />}
            />
            {myClubs.length ? (
              <ul className="divide-y divide-line" role="list">
                {myClubs.map(({ club }) => (
                  <li key={club.id}>
                    <Link href={`/clubs/${club.id}`} className={rowLink}>
                      <Avatar name={club.name} src={club.image_url} />
                      <p className="min-w-0 flex-1 truncate font-medium">{club.name}</p>
                      <CategoryBadge category={club.category} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-5">
                <EmptyState
                  icon={Users}
                  title="No clubs yet"
                  description="Join a club to meet people who share your interests."
                  action={
                    <Link href="/clubs" className={buttonStyles({ variant: "outline", size: "sm" })}>
                      Explore clubs
                    </Link>
                  }
                />
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
