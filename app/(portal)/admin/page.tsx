import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  FileText,
  GraduationCap,
  Megaphone,
  Ticket,
  Users,
} from "lucide-react";
import { DateTile } from "@/components/event-card";
import { Avatar } from "@/components/ui/avatar";
import { CategoryBadge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cn, embeddedCount, formatTime, timeAgo, todayInIndia } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin overview" };

// Shortcuts to every admin section (same icons as the sidebar).
const quickActions = [
  { href: "/admin/students", label: "Students", icon: GraduationCap, text: "Manage accounts and admin rights." },
  { href: "/admin/clubs", label: "Clubs", icon: Users, text: "Create, edit and remove clubs." },
  { href: "/admin/events", label: "Events", icon: CalendarDays, text: "Schedule events and see sign-ups." },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone, text: "Publish news for everyone." },
  { href: "/admin/resources", label: "Resources", icon: FileText, text: "Moderate shared study material." },
];

// Progress bar colour by how full an event is (full class strings for Tailwind).
function fillColor(percent: number) {
  if (percent >= 100) return "bg-brick-500";
  if (percent >= 75) return "bg-marigold-400";
  return "bg-pine-500";
}

const panelLink = "text-sm font-medium text-pine-700 hover:text-pine-900 hover:underline";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const supabase = await createClient();
  const today = todayInIndia();

  // head: true returns only the count, not the rows. All nine queries run in parallel.
  const results = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("clubs").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }).gte("event_date", today),
    supabase.from("event_registrations").select("*", { count: "exact", head: true }),
    supabase.from("announcements").select("*", { count: "exact", head: true }),
    supabase.from("resources").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, department, created_at")
      .eq("role", "student")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("clubs").select("id, name, category, club_members(count)"),
    supabase
      .from("events")
      .select("id, title, event_date, event_time, capacity, event_registrations(count)")
      .gte("event_date", today)
      .order("event_date")
      .order("event_time")
      .limit(5),
  ]);
  for (const result of results) if (result.error) throw result.error;

  const [students, clubs, upcoming, registrations, announcements, resources, newest, clubList, nextEvents] = results;

  // ponytail: sorts every club in JS; fine for a campus with tens of clubs,
  // move the count + order into a database view if that ever grows large.
  const popularClubs = (clubList.data ?? [])
    .map((club) => ({ ...club, members: embeddedCount(club.club_members) }))
    .sort((a, b) => b.members - a.members)
    .slice(0, 5);

  const stats = [
    { label: "Students", value: students.count, icon: GraduationCap, tone: "pine" },
    { label: "Clubs", value: clubs.count, icon: Users, tone: "sky" },
    { label: "Upcoming events", value: upcoming.count, icon: CalendarDays, tone: "marigold", hint: "From today onwards" },
    { label: "Event registrations", value: registrations.count, icon: Ticket, tone: "rose", hint: "Across all events" },
    { label: "Announcements", value: announcements.count, icon: Megaphone, tone: "marigold" },
    { label: "Resources", value: resources.count, icon: BookOpen, tone: "sky" },
  ] as const;

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Control centre"
        description="A snapshot of StudyCircle today, with shortcuts to everything you manage."
      />

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="list">
        {stats.map((stat, index) => (
          <li key={stat.label} className="animate-rise" style={{ animationDelay: `${index * 50}ms` }}>
            <StatCard {...stat} value={stat.value ?? 0} />
          </li>
        ))}
      </ul>

      <section aria-labelledby="manage-heading" className="mt-10">
        <h2 id="manage-heading" className="mb-4 text-xl font-semibold">
          Manage
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" role="list">
          {quickActions.map(({ href, label, icon: Icon, text }, index) => (
            <li key={href} className="animate-rise" style={{ animationDelay: `${(index + 3) * 50}ms` }}>
              <Link
                href={href}
                className="group block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine-600"
              >
                <Card interactive className="flex h-full flex-col p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-pine-800 text-marigold-300">
                      <Icon className="size-5" />
                    </span>
                    <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-pine-700" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{label}</h3>
                  <p className="mt-1 text-sm text-muted">{text}</p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="animate-rise self-start">
          <CardHeader
            title="Newest students"
            action={
              <Link href="/admin/students" className={panelLink}>
                View all
              </Link>
            }
          />
          {newest.data?.length ? (
            <ul className="divide-y divide-line" role="list">
              {newest.data.map((student) => (
                <li key={student.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={student.full_name || student.email} src={student.avatar_url} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{student.full_name || student.email}</p>
                    <p className="truncate text-xs text-muted">{student.department ?? "No department"}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted">{timeAgo(student.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 text-sm text-muted">No students have registered yet.</p>
          )}
        </Card>

        <Card className="animate-rise self-start" style={{ animationDelay: "50ms" }}>
          <CardHeader
            title="Most popular clubs"
            description="By number of members"
            action={
              <Link href="/admin/clubs" className={panelLink}>
                Manage
              </Link>
            }
          />
          {popularClubs.length ? (
            <ol className="divide-y divide-line" role="list">
              {popularClubs.map((club, index) => (
                <li key={club.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="w-5 shrink-0 font-display text-lg font-semibold text-marigold-700">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/clubs/${club.id}`} className="block truncate text-sm font-medium hover:text-pine-700 hover:underline">
                      {club.name}
                    </Link>
                    <CategoryBadge category={club.category} className="mt-1" />
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-pine-700">
                    <Users className="size-4" />
                    {club.members}
                    <span className="sr-only">member{club.members === 1 ? "" : "s"}</span>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="px-5 py-6 text-sm text-muted">No clubs yet.</p>
          )}
        </Card>

        <Card className="animate-rise self-start lg:col-span-2 xl:col-span-1" style={{ animationDelay: "100ms" }}>
          <CardHeader
            title="Upcoming events"
            description="Fill rate of the next five"
            action={
              <Link href="/admin/events" className={panelLink}>
                Manage
              </Link>
            }
          />
          {nextEvents.data?.length ? (
            <ul className="divide-y divide-line" role="list">
              {nextEvents.data.map((event) => {
                const registered = embeddedCount(event.event_registrations);
                const percent = Math.min(100, Math.round((registered / event.capacity) * 100));
                return (
                  <li key={event.id} className="flex items-center gap-3 px-5 py-3">
                    <DateTile date={event.event_date} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/events/${event.id}`} className="block truncate text-sm font-medium hover:text-pine-700 hover:underline">
                        {event.title}
                      </Link>
                      <div className="mt-0.5 flex justify-between gap-2 text-xs text-muted">
                        <span>{formatTime(event.event_time)}</span>
                        <span>
                          {registered} / {event.capacity} registered
                        </span>
                      </div>
                      {/* The numbers above carry the meaning, so the bar is decoration for screen readers. */}
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/8" aria-hidden="true">
                        <div className={cn("h-full rounded-full", fillColor(percent))} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-5 py-6 text-sm text-muted">No upcoming events scheduled.</p>
          )}
        </Card>
      </div>
    </>
  );
}
