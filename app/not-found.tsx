import { NotFoundContent } from "@/components/not-found-content";

// Unknown URLs anywhere in the app.
export default function NotFound() {
  return (
    <main className="bg-dots flex min-h-dvh items-center justify-center">
      <NotFoundContent />
    </main>
  );
}
