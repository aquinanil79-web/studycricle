import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen, CalendarDays, Users } from "lucide-react";
import { Logo } from "@/components/logo";
import { getCurrentUser } from "@/lib/auth";

const benefits = [
  { icon: Users, text: "Join clubs and find people who share your interests" },
  { icon: CalendarDays, text: "Register for campus events before the seats run out" },
  { icon: BookOpen, text: "Share notes and study material with your batch" },
];

// Shell for /login and /register: brand panel on the left (desktop only), form on the right.
export default async function AuthLayout({ children }: { children: ReactNode }) {
  // Already logged in (with an existing profile)? Go straight to the dashboard.
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="bg-dots sticky top-0 hidden h-dvh flex-col justify-between overflow-hidden bg-pine-950 p-10 text-paper lg:flex xl:p-14">
        <Logo tone="light" />

        <div className="max-w-md animate-rise">
          <p className="eyebrow text-marigold-300">Learn together. Compete together. Grow together.</p>
          {/* A <p>, not a heading: each page's <h1> should be the first heading on the page. */}
          <p className="mt-3 font-display text-4xl leading-tight font-semibold tracking-tight xl:text-5xl">
            Everything on campus, <span className="text-marigold-300">in one place.</span>
          </p>
          <p className="mt-4 text-pine-100/80">
            Clubs, events, announcements and study resources for every student, without hunting through group
            chats.
          </p>
          <ul className="mt-10 space-y-4" role="list">
            {benefits.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-pine-50">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-pine-800 text-marigold-300">
                  <Icon className="size-4.5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-pine-300">Made by students, for students.</p>
      </aside>

      <main className="flex min-h-dvh flex-col px-4 py-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between gap-4">
          <Logo className="lg:hidden" />
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine-600"
          >
            <ArrowLeft className="size-4" /> Back to home
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">{children}</div>
      </main>
    </div>
  );
}
