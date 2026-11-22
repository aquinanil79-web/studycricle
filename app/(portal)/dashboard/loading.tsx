import { Skeleton } from "@/components/ui/skeleton";

// Placeholder shaped like the dashboard: greeting, 4 stats, events grid and side lists.
export default function DashboardLoading() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Loading your dashboard...</span>
      <Skeleton className="mb-3 h-4 w-32" />
      <Skeleton className="mb-2 h-10 w-80 max-w-full" />
      <Skeleton className="mb-8 h-5 w-64 max-w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} block className="h-24" />
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Skeleton className="h-7 w-48" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} block className="h-36" />
            ))}
          </div>
          <Skeleton block className="h-72" />
        </div>
        <div className="space-y-6">
          <Skeleton block className="h-80" />
          <Skeleton block className="h-72" />
        </div>
      </div>
    </div>
  );
}
