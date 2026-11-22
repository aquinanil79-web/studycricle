import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";

/** 404 message shared by app/not-found.tsx (unknown URLs) and app/(portal)/not-found.tsx (missing club/event). */
export function NotFoundContent() {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-marigold-100 text-marigold-700">
        <Compass className="size-8" />
      </div>
      <p className="eyebrow text-marigold-700">Error 404</p>
      <h1 className="mt-2 text-4xl font-semibold">This page wandered off campus</h1>
      <p className="mt-3 max-w-md text-muted">
        The club, event or page you are looking for does not exist or may have been removed.
      </p>
      <Link href="/dashboard" className={buttonStyles({ className: "mt-8" })}>
        Back to dashboard
      </Link>
    </div>
  );
}
