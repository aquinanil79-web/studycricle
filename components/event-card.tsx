import Link from "next/link";
import { Check, Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { CampusEvent } from "@/lib/types";
import { cn, dateParts, formatTime, todayInIndia } from "@/lib/utils";

/** Calendar-style date block: "OCT / 14 / Wed". */
export function DateTile({ date, className }: { date: string; className?: string }) {
  const { day, month, weekday } = dateParts(date);
  return (
    <div
      className={cn(
        "flex w-16 shrink-0 flex-col items-center overflow-hidden rounded-xl border border-line bg-white text-center shadow-xs",
        className,
      )}
    >
      <span className="w-full bg-pine-800 py-0.5 text-[0.65rem] font-bold tracking-widest text-marigold-200">{month}</span>
      <span className="font-display text-2xl leading-tight font-semibold text-ink">{day}</span>
      <span className="pb-1 text-[0.65rem] font-medium text-muted uppercase">{weekday}</span>
    </div>
  );
}

/**
 * "12 seats left" / "Full" / "Registered" / "Past event" label for an event.
 * Leave out `registrations` when it is unknown (visitors who are not logged in cannot read them).
 */
export function SeatsBadge({
  event,
  registrations,
  registered,
}: {
  event: CampusEvent;
  registrations?: number;
  registered: boolean;
}) {
  if (event.event_date < todayInIndia()) return <Badge tone="neutral">Past event</Badge>;
  if (registrations === undefined) return <Badge tone="sky">{event.capacity} seats</Badge>;
  if (registered) {
    return (
      <Badge tone="pine">
        <Check className="size-3" /> Registered
      </Badge>
    );
  }
  const left = Math.max(event.capacity - registrations, 0);
  if (left === 0) return <Badge tone="rose">Full</Badge>;
  return <Badge tone={left <= 10 ? "marigold" : "sky"}>{left} seats left</Badge>;
}

/** Event summary card linking to the event page. Used on /events, the dashboard and the landing page. */
export function EventCard({
  event,
  registrations,
  registered = false,
  href = `/events/${event.id}`,
}: {
  event: CampusEvent;
  registrations?: number;
  registered?: boolean;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine-600"
    >
      <Card interactive className="flex h-full gap-4 p-5">
        <DateTile date={event.event_date} className="self-start" />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="mb-1.5">
            <SeatsBadge event={event} registrations={registrations} registered={registered} />
          </div>
          <h3 className="text-lg leading-snug font-semibold">{event.title}</h3>
          <p className="mt-0.5 text-sm text-muted">by {event.organizer}</p>
          <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-3 text-sm text-ink/80">
            <span className="flex items-center gap-1.5">
              <Clock className="size-4 text-pine-600" /> {formatTime(event.event_time)}
            </span>
            <span className="flex min-w-0 items-center gap-1.5">
              <MapPin className="size-4 shrink-0 text-pine-600" /> <span className="truncate">{event.location}</span>
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
