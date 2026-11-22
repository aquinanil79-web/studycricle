import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** White panel with a hairline border. Add `interactive` for cards that are links. */
export function Card({
  interactive = false,
  className,
  ...props
}: ComponentProps<"div"> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-surface shadow-card",
        interactive && "transition duration-200 hover:-translate-y-0.5 hover:border-pine-200 hover:shadow-lift",
        className,
      )}
      {...props}
    />
  );
}

/** Card heading row with an optional action (link or button) on the right. */
export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
