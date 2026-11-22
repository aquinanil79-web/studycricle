import Link from "next/link";
import { UsersRound } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** StudyCircle wordmark. `tone` picks colours for a light or a dark background. */
export function Logo({
  href = "/",
  tone = "dark",
  className,
}: {
  href?: string;
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-marigold-400",
        className,
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-marigold-400 text-pine-950">
        <UsersRound className="size-5" />
      </span>
      <span
        className={cn(
          "font-display text-xl font-semibold tracking-tight",
          tone === "light" ? "text-paper" : "text-pine-950",
        )}
      >
        {APP_NAME}
      </span>
    </Link>
  );
}
