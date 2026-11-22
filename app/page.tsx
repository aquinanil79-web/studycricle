import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  GraduationCap,
  IdCard,
  Megaphone,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ClubCard } from "@/components/club-card";
import { EventCard } from "@/components/event-card";
import { Noticeboard } from "@/components/landing/noticeboard";
import { Logo } from "@/components/logo";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/lib/auth";
import { BUCKETS, CLUB_CATEGORIES, DEPARTMENTS } from "@/lib/constants";
import { db } from "@/lib/db";
import { clubs as clubsTable, events as eventsTable } from "@/lib/db/schema";
import { asc, count, desc, gte } from "drizzle-orm";
import { cn, firstName, todayInIndia } from "@/lib/utils";

// "absolute" skips the "%s | StudyCircle" template from the root layout.
export const metadata: Metadata = { title: { absolute: "StudyCircle — learn together" } };

const sections = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#events", label: "Events" },
  { href: "#clubs", label: "Clubs" },
];

const steps: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: IdCard,
    title: "Sign up with your student ID",
    text: "Add your department and year once. Your profile and photo follow you across the portal.",
  },
  {
    icon: Users,
    title: "Join clubs, grab event seats",
    text: "Join the clubs you care about and register for events before the seats run out.",
  },
  {
    icon: Sparkles,
    title: "Stay in the loop",
    text: "Read college announcements, download notes shared by classmates and join the discussion.",
  },
];

const features: { icon: LucideIcon; title: string; text: string; tag: string }[] = [
  {
    icon: Users,
    title: "Clubs & societies",
    text: "Browse technical, cultural, sports and literary clubs, see who is in and join with one click.",
    tag: "One-click join",
  },
  {
    icon: CalendarDays,
    title: "Events & registrations",
    text: "Fests, hackathons and seminars with live seat counts, so you know when to hurry.",
    tag: "Live seat counts",
  },
  {
    icon: Megaphone,
    title: "Announcements",
    text: "Academic, examination and placement notices from the college, newest first.",
    tag: "Never miss a circular",
  },
  {
    icon: BookOpen,
    title: "Study resources",
    text: "Notes, slides and question papers shared by students, sorted by subject.",
    tag: `Files up to ${BUCKETS.resources.maxSizeMB} MB`,
  },
  {
    icon: MessagesSquare,
    title: "Discussions",
    text: "Ask questions and make plans in the comments on every club and event page.",
    tag: "Comments everywhere",
  },
  {
    icon: ShieldCheck,
    title: "Admin tools",
    text: "Staff manage students, clubs, events, notices and resources from one dashboard.",
    tag: "Role-based access",
  },
];

const linkStyles = "rounded-md focus-visible:outline-2 focus-visible:outline-offset-2";

/** Eyebrow + h2 + intro used by every landing section. `dark` is for the pine background. */
function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  action,
  dark = false,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  dark?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-2xl">
        <p className={cn("eyebrow", dark ? "text-marigold-300" : "text-marigold-700")}>{eyebrow}</p>
        <h2 id={id} className={cn("mt-2 text-3xl font-semibold sm:text-4xl", dark && "text-paper")}>
          {title}
        </h2>
        <p className={cn("mt-3 text-lg", dark ? "text-pine-100/75" : "text-muted")}>{description}</p>
      </div>
      {action}
    </div>
  );
}

// Public page: proxy.ts lets everyone in, so there is no requireUser() here.
// A logged-in visitor gets "Go to dashboard" instead of the sign-up buttons.
export default async function LandingPage() {
  const user = await getCurrentUser();
  const today = todayInIndia();
  const [[eventTotal], [clubTotal], events, clubs] = await Promise.all([
    db.select({ value: count() }).from(eventsTable).where(gte(eventsTable.event_date, today)),
    db.select({ value: count() }).from(clubsTable),
    db.select().from(eventsTable).where(gte(eventsTable.event_date, today)).orderBy(asc(eventsTable.event_date), asc(eventsTable.event_time)).limit(3),
    db.select().from(clubsTable).orderBy(desc(clubsTable.created_at)).limit(4),
  ]);
  const eventCount = eventTotal?.value ?? 0;
  const clubCount = clubTotal?.value ?? 0;

  // Detail pages need a login, so visitors are sent to /login (undefined = the card's default link).
  const cardHref = user ? undefined : "/login";
  const name = user ? firstName(user.full_name) : "";

  const stats = [
    { label: "Clubs to join", value: clubCount ?? 0 },
    { label: "Upcoming events", value: eventCount ?? 0 },
    { label: "Departments", value: DEPARTMENTS.length },
    { label: "Club categories", value: CLUB_CATEGORIES.length },
  ];

  const accountLinks = user
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/profile", label: "My profile" },
      ]
    : [
        { href: "/login", label: "Log in" },
        { href: "/register", label: "Create an account" },
      ];

  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-marigold-300 px-3 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      {/* ---------- Top navigation ---------- */}
      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav aria-label="Page sections" className="hidden md:block">
            <ul className="flex gap-1" role="list">
              {sections.map((section) => (
                <li key={section.href}>
                  <a
                    href={section.href}
                    className={cn(
                      linkStyles,
                      "px-3 py-2 text-sm font-medium text-ink/70 transition-colors hover:bg-pine-50 hover:text-ink focus-visible:outline-pine-600",
                    )}
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {/* Small buttons on phones, normal size from the sm breakpoint. */}
            {user ? (
              <Link href="/dashboard" className={buttonStyles({ size: "sm", className: "sm:h-10 sm:px-4 sm:text-sm" })}>
                Go to dashboard <ArrowRight className="size-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className={buttonStyles({ variant: "ghost", size: "sm", className: "sm:h-10 sm:px-4 sm:text-sm" })}
                >
                  Log in
                </Link>
                <Link href="/register" className={buttonStyles({ size: "sm", className: "sm:h-10 sm:px-4 sm:text-sm" })}>
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main id="main">
        {/* ---------- Hero ---------- */}
        <section className="bg-dots relative overflow-hidden">
          {/* Soft marigold glow behind the noticeboard */}
          <div className="pointer-events-none absolute -top-40 -right-40 size-[40rem] rounded-full bg-marigold-200/50 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:px-8 lg:pt-20 lg:pb-28">
            <div className="animate-rise">
              <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-sm font-medium text-pine-800 shadow-xs">
                <GraduationCap className="size-4 text-marigold-600" />
                {user ? `Welcome back, ${name || "student"}` : "The student portal for your college"}
              </p>
              <h1 className="mt-6 text-5xl leading-[1.04] font-semibold text-pine-950 sm:text-6xl xl:text-7xl">
                Your campus life,{" "}
                <span className="text-pine-600 italic underline decoration-marigold-400 decoration-4 underline-offset-8">
                  in one place.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/75">
                StudyCircle brings every club, event, notice and set of notes at your college together. Join a
                society, book a seat at the next fest and read exam circulars before anyone forwards them to
                the class group.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {user ? (
                  <Link href="/dashboard" className={buttonStyles({ size: "lg", className: "group" })}>
                    Go to dashboard
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ) : (
                  <>
                    <Link href="/register" className={buttonStyles({ size: "lg", className: "group" })}>
                      Create your account
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                    <Link href="/login" className={buttonStyles({ variant: "outline", size: "lg" })}>
                      Log in
                    </Link>
                  </>
                )}
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted" role="list">
                {["Free for students", "Sign up with your student ID", "Works on any phone"].map((point) => (
                  <li key={point} className="flex items-center gap-1.5">
                    <Check className="size-4 text-pine-600" /> {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="animate-rise" style={{ animationDelay: "120ms" }}>
              <Noticeboard events={events} />
            </div>
          </div>
        </section>

        {/* ---------- Stats strip ---------- */}
        <section aria-label="StudyCircle in numbers" className="border-y border-line bg-surface">
          <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-line lg:grid-cols-4">
            {stats.map((stat) => (
              // flex-col-reverse shows the number above its label while <dt> stays first for screen readers.
              <div key={stat.label} className="flex flex-col-reverse bg-surface px-6 py-7 text-center lg:py-9">
                <dt className="mt-1 text-sm font-medium text-muted">{stat.label}</dt>
                {/* An empty database shows "Soon" rather than a sad zero. */}
                <dd className="font-display text-4xl font-semibold text-pine-900">{stat.value || "Soon"}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---------- How it works ---------- */}
        <section
          id="how-it-works"
          aria-labelledby="how-heading"
          className="mx-auto max-w-7xl scroll-mt-16 px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
        >
          <SectionHeading
            id="how-heading"
            eyebrow="How it works"
            title="Set up before your next lecture"
            description="No forms at the office and no forwarded messages to chase. Three steps and you are in."
          />
          <ol className="mt-12 grid gap-5 md:grid-cols-3" role="list">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <li key={title}>
                <Card className="relative h-full overflow-hidden p-6 sm:p-7">
                  <span aria-hidden="true" className="absolute -top-3 right-4 font-display text-8xl font-semibold text-marigold-100">
                    {index + 1}
                  </span>
                  <div className="relative flex size-12 items-center justify-center rounded-xl bg-pine-800 text-marigold-300">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="relative mt-5 text-xl font-semibold">{title}</h3>
                  <p className="relative mt-2 leading-relaxed text-muted">{text}</p>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- Features ---------- */}
        <section id="features" aria-labelledby="features-heading" className="scroll-mt-16 bg-pine-950">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <SectionHeading
              id="features-heading"
              dark
              eyebrow="Features"
              title="Everything your campus needs, nothing it does not"
              description="One login for the notice board, the club fair, the seminar hall and the notes cupboard."
            />
            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="list">
              {features.map(({ icon: Icon, title, text, tag }) => (
                <li
                  key={title}
                  className="flex flex-col rounded-2xl border border-pine-800 bg-pine-900/60 p-6 transition-colors hover:border-pine-600"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-marigold-400 text-pine-950">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-paper">{title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-pine-100/75">{text}</p>
                  <p className="mt-5 self-start rounded-full bg-pine-800 px-2.5 py-0.5 text-xs font-semibold text-marigold-200">
                    {tag}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ---------- Upcoming events ---------- */}
        <section
          id="events"
          aria-labelledby="events-heading"
          className="mx-auto max-w-7xl scroll-mt-16 px-4 pt-20 sm:px-6 lg:px-8 lg:pt-28"
        >
          <SectionHeading
            id="events-heading"
            eyebrow="Coming up"
            title="Upcoming events"
            description="The next few things happening on campus. Log in to grab a seat."
            action={
              <Link href={user ? "/events" : "/login"} className={buttonStyles({ variant: "outline" })}>
                See all events <ArrowRight className="size-4" />
              </Link>
            }
          />
          <div className="mt-10">
            {events.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No upcoming events yet"
                description="Fests, workshops and seminars will be pinned here as soon as they are announced."
              />
            ) : (
              <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" role="list">
                {events.map((event, index) => (
                  <li key={event.id} className="animate-rise" style={{ animationDelay: `${index * 60}ms` }}>
                    <EventCard event={event} href={cardHref} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* ---------- Clubs ---------- */}
        <section
          id="clubs"
          aria-labelledby="clubs-heading"
          className="mx-auto max-w-7xl scroll-mt-16 px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
        >
          <SectionHeading
            id="clubs-heading"
            eyebrow="Find your people"
            title="Clubs & societies"
            description="Coding, dance, debate, football, startups. There is a crowd for everyone."
            action={
              <Link href={user ? "/clubs" : "/login"} className={buttonStyles({ variant: "outline" })}>
                Browse all clubs <ArrowRight className="size-4" />
              </Link>
            }
          />
          <div className="mt-10">
            {clubs.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Clubs are on their way"
                description="Clubs appear here as soon as the college adds them. Sign up now and be among the first to join."
              />
            ) : (
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" role="list">
                {clubs.map((club, index) => (
                  <li key={club.id} className="animate-rise" style={{ animationDelay: `${index * 60}ms` }}>
                    <ClubCard club={club} href={cardHref} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* ---------- Call to action ---------- */}
        <section aria-labelledby="cta-heading" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
          <div className="bg-dots relative overflow-hidden rounded-3xl bg-marigold-400 px-6 py-14 text-center shadow-lift sm:px-12 sm:py-20">
            <h2 id="cta-heading" className="mx-auto max-w-2xl text-3xl font-semibold text-pine-950 sm:text-5xl">
              {user ? "Everything is waiting on your dashboard." : "Your next favourite club is one click away."}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-pine-900/85">
              {user
                ? "Catch up on new announcements, events and resources since your last visit."
                : "Create your free account with your student ID and see what is happening on campus this week."}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href={user ? "/dashboard" : "/register"}
                className={buttonStyles({ size: "lg" })}
              >
                {user ? "Open dashboard" : "Get started for free"} <ArrowRight className="size-4" />
              </Link>
              {!user && (
                <Link
                  href="/login"
                  className={buttonStyles({ variant: "outline", size: "lg" })}
                >
                  I already have an account
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="bg-pine-950 text-pine-100/80">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-[2fr_1fr_1fr] lg:px-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo tone="light" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed">
              The student portal for clubs, events, announcements and shared study material. Made for students,
              by students.
            </p>
          </div>
          {[
            { title: "Explore", links: sections },
            { title: "Account", links: accountLinks },
          ].map((group) => (
            <nav key={group.title} aria-label={`Footer: ${group.title}`}>
              <p className="eyebrow text-marigold-300">{group.title}</p>
              <ul className="mt-4 space-y-2.5 text-sm" role="list">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(linkStyles, "transition-colors hover:text-paper focus-visible:outline-marigold-400")}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="border-t border-pine-800">
          <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 px-4 py-6 text-xs text-pine-200/80 sm:px-6 lg:px-8">
            <p>
              &copy; {today.slice(0, 4)} StudyCircle
            </p>
            <p>A college project built with Next.js and Supabase.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
