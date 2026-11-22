import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "pine" | "marigold" | "sky" | "violet" | "rose" | "neutral";

// Full class strings (not built dynamically) so Tailwind can find them.
const tones: Record<Tone, string> = {
  pine: "bg-pine-100 text-pine-800",
  marigold: "bg-marigold-100 text-marigold-700",
  sky: "bg-sky-100 text-sky-800",
  violet: "bg-violet-100 text-violet-800",
  rose: "bg-rose-100 text-rose-800",
  neutral: "bg-ink/5 text-ink/70",
};

// One fixed colour per known category, so a category looks the same on every page.
const categoryTones: Record<string, Tone> = {
  // clubs
  Technical: "sky",
  Cultural: "rose",
  Sports: "marigold",
  Literary: "violet",
  "Social Service": "pine",
  Entrepreneurship: "marigold",
  // announcements
  General: "neutral",
  Academic: "sky",
  Examination: "rose",
  Placement: "pine",
  Event: "violet",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Badge for a club or announcement category, coloured by category name. */
export function CategoryBadge({ category, className }: { category: string; className?: string }) {
  return (
    <Badge tone={categoryTones[category] ?? "neutral"} className={className}>
      {category}
    </Badge>
  );
}
