"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Shield,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Avatar } from "@/components/ui/avatar";
import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };

const studentSections = [
  { title: "Home", items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  {
    title: "Discover",
    items: [
      { href: "/clubs", label: "Clubs", icon: Users },
      { href: "/events", label: "Events", icon: CalendarDays },
      { href: "/announcements", label: "Announcements", icon: Megaphone },
      { href: "/resources", label: "Resources", icon: BookOpen },
    ],
  },
  { title: "Personal", items: [{ href: "/profile", label: "My Profile", icon: User }] },
] satisfies { title: string; items: NavItem[] }[];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Overview", icon: Shield },
  { href: "/admin/students", label: "Students", icon: GraduationCap },
  { href: "/admin/clubs", label: "Clubs", icon: Users },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/resources", label: "Resources", icon: FileText },
];

export type NavUser = { name: string; email: string; avatarUrl: string | null; isAdmin: boolean };

function isActive(pathname: string, href: string) {
  // "/admin" should only be active on the overview page, not on every admin page.
  if (href === "/admin" || href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavSection({ title, items, pathname }: { title: string; items: NavItem[]; pathname: string }) {
  return (
    <div>
      <p className="eyebrow mb-2 px-3 text-pine-300/70">{title}</p>
      <ul className="space-y-0.5" role="list">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-marigold-400",
                  active ? "bg-pine-800 text-paper" : "text-pine-100/80 hover:bg-pine-900 hover:text-paper",
                )}
              >
                {active && <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-marigold-400" />}
                <Icon className={cn("size-4.5", active ? "text-marigold-300" : "text-pine-300")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Logo, navigation links and the signed-in user, stacked vertically. Used by the sidebar and the mobile drawer. */
function NavPanel({ user }: { user: NavUser }) {
  const pathname = usePathname();

  return (
    <div className="bg-dots flex h-full flex-col bg-pine-950 text-paper">
      <div className="px-5 py-5">
        <Logo href="/dashboard" tone="light" />
      </div>
      <nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
        {studentSections.map((section) => (
          <NavSection key={section.title} title={section.title} items={section.items} pathname={pathname} />
        ))}
        {user.isAdmin && <NavSection title="Admin" items={adminNav} pathname={pathname} />}
      </nav>
      <div className="border-t border-pine-800 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar name={user.name} src={user.avatarUrl} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-pine-300">{user.email}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              aria-label="Log out"
              title="Log out"
              className="rounded-md p-2 text-pine-300 transition-colors hover:bg-pine-900 hover:text-paper focus-visible:outline-2 focus-visible:outline-marigold-400"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/** Fixed sidebar, visible on large screens. */
export function Sidebar({ user }: { user: NavUser }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
      <NavPanel user={user} />
    </aside>
  );
}

/** Menu button plus slide-in drawer for small screens (native <dialog>, so focus and Escape just work). */
export function MobileNav({ user }: { user: NavUser }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Keep the <dialog> element in sync with the open state.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="rounded-lg p-2 text-ink hover:bg-pine-50 focus-visible:outline-2 focus-visible:outline-pine-600 lg:hidden"
      >
        <Menu className="size-5" />
      </button>
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        // Close on a press on the backdrop, and after choosing a link.
        onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}
        onClick={(event) => (event.target as HTMLElement).closest("a") && setOpen(false)}
        aria-label="Menu"
        className="m-0 h-dvh max-h-dvh w-72 max-w-[85vw] bg-transparent p-0 backdrop:bg-pine-950/60 open:animate-rise"
      >
        <div className="relative h-full">
          <NavPanel user={user} />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="absolute top-5 right-3 rounded-md p-1.5 text-pine-200 hover:bg-pine-900 focus-visible:outline-2 focus-visible:outline-marigold-400"
          >
            <X className="size-5" />
          </button>
        </div>
      </dialog>
    </>
  );
}
