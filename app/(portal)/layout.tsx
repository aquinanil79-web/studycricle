import type { ReactNode } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Logo } from "@/components/logo";
import { MobileNav, Sidebar, type NavUser } from "@/components/portal/nav";
import { Avatar } from "@/components/ui/avatar";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { announcements } from "@/lib/db/schema";
import { count, gte } from "drizzle-orm";
import { daysAgo } from "@/lib/utils";

// Shell for every signed-in page: sidebar on desktop, drawer on mobile, top header.
// requireUser() here is only the first gate - each page and action checks again.
export default async function PortalLayout({ children }: { children: ReactNode }) {
  const profile = await requireUser();
  const user: NavUser = {
    name: profile.full_name || profile.email,
    email: profile.email,
    avatarUrl: profile.avatar_url,
    isAdmin: profile.role === "admin",
  };

  // Show a dot on the bell when there is an announcement from the last 3 days.
  const [{ value: newAnnouncements }] = await db.select({ value: count() }).from(announcements).where(gte(announcements.created_at, daysAgo(3)));

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-marigold-300 px-3 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Sidebar user={user} />

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-paper/85 px-4 backdrop-blur-md sm:px-6 lg:px-10">
          <MobileNav user={user} />
          <Logo href="/dashboard" className="lg:hidden" />
          <div className="ml-auto flex items-center gap-2">
            {user.isAdmin && (
              <span className="hidden rounded-full bg-marigold-100 px-2.5 py-1 text-xs font-semibold text-marigold-700 sm:inline">
                Admin
              </span>
            )}
            <Link
              href="/announcements"
              aria-label={newAnnouncements ? `Announcements (${newAnnouncements} new)` : "Announcements"}
              className="relative rounded-lg p-2 text-muted transition-colors hover:bg-pine-50 hover:text-ink focus-visible:outline-2 focus-visible:outline-pine-600"
            >
              <Bell className="size-5" />
              {Boolean(newAnnouncements) && (
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-marigold-500 ring-2 ring-paper" />
              )}
            </Link>
            <Link
              href="/profile"
              aria-label="My profile"
              className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine-600"
            >
              <Avatar name={user.name} src={user.avatarUrl} size="sm" />
            </Link>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
