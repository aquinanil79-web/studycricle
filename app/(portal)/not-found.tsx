import { NotFoundContent } from "@/components/not-found-content";

// notFound() inside a portal page (e.g. a deleted club): shown inside the sidebar layout,
// which already provides the <main> element.
export default function PortalNotFound() {
  return <NotFoundContent />;
}
