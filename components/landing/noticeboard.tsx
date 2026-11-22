import type { ReactNode } from "react";
import { CalendarDays, Clock, MapPin, Megaphone, Users, type LucideIcon } from "lucide-react";
import { DateTile } from "@/components/event-card";
import type { CampusEvent } from "@/lib/types";
import { cn, formatTime } from "@/lib/utils";

// Each note hangs at a slightly different angle, like paper pinned to a real board.
// Full class strings (not built dynamically) so Tailwind can find them.
const tilts = ["-rotate-2 sm:mr-10", "rotate-1 sm:ml-10", "-rotate-1 sm:mr-5"];

// Shown while there are no upcoming events: what students will find here, never made-up events.
const placeholders: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: CalendarDays, title: "Fests, workshops & seminars", text: "Register for a seat in one tap" },
  { icon: Users, title: "Club sign-ups", text: "Technical, cultural, sports and more" },
  { icon: Megaphone, title: "Exam & placement notices", text: "Straight from the college office" },
];

function Note({ index, children }: { index: number; children: ReactNode }) {
  return (
    <li
      className={cn(
        "relative animate-rise rounded-2xl bg-surface p-4 shadow-lift transition duration-300 hover:rotate-0",
        tilts[index],
      )}
      style={{ animationDelay: `${250 + index * 120}ms` }}
    >
      {/* The pin holding the note */}
      <span className="absolute -top-1.5 left-1/2 size-3.5 -translate-x-1/2 rounded-full bg-marigold-400 shadow-sm ring-4 ring-pine-900" />
      {children}
    </li>
  );
}

/** Hero visual: the next upcoming events as notes pinned to a board (placeholders when there are none). */
export function Noticeboard({ events }: { events: CampusEvent[] }) {
  const live = events.length > 0;

  return (
    <div className="relative rounded-3xl bg-pine-900 p-5 shadow-lift ring-1 ring-pine-800 sm:p-8">
      <div className="mb-7 flex items-center justify-between gap-4">
        <p className="eyebrow text-marigold-300">Campus noticeboard</p>
        <p className="flex items-center gap-2 text-xs font-medium text-pine-200">
          <span className={cn("size-2 rounded-full", live ? "animate-pulse bg-marigold-400" : "bg-pine-400")} />
          {live ? "Live from StudyCircle" : "Preview"}
        </p>
      </div>

      <ul className="space-y-5" role="list">
        {live
          ? events.map((event, index) => (
              <Note key={event.id} index={index}>
                <div className="flex items-center gap-4">
                  <DateTile date={event.event_date} />
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-semibold">{event.title}</p>
                    <p className="truncate text-sm text-muted">by {event.organizer}</p>
                    <p className="mt-1 flex min-w-0 items-center gap-3 text-xs text-ink/75">
                      <span className="flex shrink-0 items-center gap-1">
                        <Clock className="size-3.5 text-pine-600" /> {formatTime(event.event_time)}
                      </span>
                      <span className="flex min-w-0 items-center gap-1">
                        <MapPin className="size-3.5 shrink-0 text-pine-600" />
                        <span className="truncate">{event.location}</span>
                      </span>
                    </p>
                  </div>
                </div>
              </Note>
            ))
          : placeholders.map(({ icon: Icon, title, text }, index) => (
              <Note key={title} index={index}>
                <div className="flex items-center gap-4">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-pine-100 text-pine-700">
                    <Icon className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-lg font-semibold">{title}</p>
                    <p className="text-sm text-muted">{text}</p>
                  </div>
                </div>
              </Note>
            ))}
      </ul>

      {/* Sticker in the corner */}
      <p className="absolute -bottom-6 -left-6 hidden size-24 -rotate-12 items-center justify-center rounded-full bg-marigold-400 p-3 text-center font-display text-sm leading-tight font-semibold text-pine-950 shadow-lift sm:flex">
        Free for every student
      </p>
    </div>
  );
}
