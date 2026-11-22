import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "./card";

type Tone = "pine" | "marigold" | "sky" | "rose";

const tones: Record<Tone, string> = {
  pine: "bg-pine-100 text-pine-700",
  marigold: "bg-marigold-100 text-marigold-700",
  sky: "bg-sky-100 text-sky-700",
  rose: "bg-rose-100 text-rose-700",
};

/** A single number with a label, used in the dashboard statistics rows. */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "pine",
  hint,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: Tone;
  hint?: string;
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl", tones[tone])}>
        <Icon className="size-6" />
      </div>
      <div className="min-w-0">
        <p className="eyebrow text-muted">{label}</p>
        <p className="font-display text-3xl leading-tight font-semibold">{value}</p>
        {hint && <p className="truncate text-xs text-muted">{hint}</p>}
      </div>
    </Card>
  );
}
