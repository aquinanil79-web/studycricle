import { cn } from "@/lib/utils";

/** Grey pulsing placeholder used in loading.tsx files. `block` gives it card corners instead of text-line corners. */
export function Skeleton({ block = false, className }: { block?: boolean; className?: string }) {
  return <div className={cn("animate-pulse bg-ink/8", block ? "rounded-2xl" : "rounded-lg", className)} />;
}

/** Loading placeholder shaped like a portal page: header, stat row, card grid. */
export function PageSkeleton() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading...</span>
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="mb-2 h-10 w-72 max-w-full" />
      <Skeleton className="mb-8 h-5 w-96 max-w-full" />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} block className="h-48" />
        ))}
      </div>
    </div>
  );
}
