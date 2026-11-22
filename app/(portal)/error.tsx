"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

// Shown when a portal page throws (for example the database is unreachable).
export default function PortalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-brick-100 text-brick-600">
        <TriangleAlert className="size-7" />
      </div>
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-muted">
        We could not load this page. Check your connection and try again.
        {error.digest && <span className="mt-1 block text-xs">Reference: {error.digest}</span>}
      </p>
      <Button onClick={() => retry()} className="mt-6">
        Try again
      </Button>
    </div>
  );
}
