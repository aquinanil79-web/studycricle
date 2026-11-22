import { PageSkeleton } from "@/components/ui/skeleton";

// Shown instantly while a portal page loads its data on the server.
export default function Loading() {
  return <PageSkeleton />;
}
