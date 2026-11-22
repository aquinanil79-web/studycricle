import type { Metadata } from "next";
import { Megaphone, Pencil, Plus, Trash } from "lucide-react";
import { AnnouncementFields } from "@/components/admin/announcement-fields";
import { ConfirmButton } from "@/components/ui/action-button";
import { CategoryBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormModal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { SearchFilter } from "@/components/ui/search-filter";
import { createAnnouncement, deleteAnnouncement, updateAnnouncement } from "@/lib/actions/announcements";
import { requireAdmin } from "@/lib/auth";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/constants";
import { db } from "@/lib/db";
import { announcements, profiles } from "@/lib/db/schema";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { firstParam, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Manage announcements" };

export default async function AdminAnnouncementsPage({ searchParams }: PageProps<"/admin/announcements">) {
  await requireAdmin();
  const params = await searchParams;
  const q = firstParam(params.q);
  const category = firstParam(params.category);

  const conditions = [
    q ? or(ilike(announcements.title, `%${q}%`), ilike(announcements.content, `%${q}%`)) : undefined,
    category ? eq(announcements.category, category) : undefined,
  ].filter(Boolean);
  const announcementRows = await db.select({
    id: announcements.id, title: announcements.title, content: announcements.content, category: announcements.category,
    author_id: announcements.author_id, created_at: announcements.created_at, updated_at: announcements.updated_at,
    author: { full_name: profiles.full_name },
  }).from(announcements).leftJoin(profiles, eq(announcements.author_id, profiles.id)).where(and(...conditions)).orderBy(desc(announcements.created_at));

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Announcements"
        description="Publish notices for every student. New announcements show up on the dashboard and the notification bell."
        action={
          <FormModal
            trigger={
              <>
                <Plus className="size-4" /> New announcement
              </>
            }
            triggerProps={{ variant: "accent" }}
            title="New announcement"
            description="Every student will see this on their dashboard."
            action={createAnnouncement}
            submitLabel="Publish"
            size="lg"
          >
            <AnnouncementFields />
          </FormModal>
        }
      />
      <SearchFilter
        action="/admin/announcements"
        query={q}
        placeholder="Search announcements by title or content"
        filter={{ name: "category", label: "All categories", value: category, options: ANNOUNCEMENT_CATEGORIES }}
      />

      {announcementRows.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={q || category ? "No announcements match your search" : "No announcements yet"}
          description={
            q || category
              ? "Try a different search term or category."
              : "Use the New announcement button to post the first notice."
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line" role="list">
            {announcementRows.map((announcement, index) => {
              // The database sets both timestamps to the same now() on insert; the trigger changes updated_at on edit.
              const edited = announcement.updated_at !== announcement.created_at;
              return (
                <li
                  key={announcement.id}
                  className="flex animate-rise flex-col gap-3 p-5 sm:flex-row sm:items-start sm:gap-6"
                  style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <CategoryBadge category={announcement.category} />
                      <p className="text-xs text-muted">
                        <time dateTime={announcement.created_at}>{formatDate(announcement.created_at)}</time>
                        {edited && <> &middot; edited {formatDate(announcement.updated_at)}</>}
                      </p>
                    </div>
                    <h2 className="mt-2 text-lg font-semibold">{announcement.title}</h2>
                    {/* Only the first line as a preview; students read the full text on /announcements. */}
                    <p className="mt-1 line-clamp-1 text-sm text-muted">{announcement.content.split("\n", 1)[0]}</p>
                    <p className="mt-2 text-xs text-muted">
                      By <span className="font-medium text-ink">{announcement.author?.full_name || "Admin"}</span>
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-1 self-end sm:self-start">
                    <FormModal
                      trigger={<Pencil className="size-4" />}
                      triggerProps={{ variant: "ghost", size: "sm", "aria-label": `Edit "${announcement.title}"` }}
                      title="Edit announcement"
                      action={updateAnnouncement.bind(null, announcement.id)}
                      submitLabel="Save changes"
                      size="lg"
                    >
                      <AnnouncementFields announcement={announcement} />
                    </FormModal>
                    <ConfirmButton
                      action={deleteAnnouncement.bind(null, announcement.id)}
                      title="Delete announcement?"
                      description={`"${announcement.title}" will be removed for every student. This cannot be undone.`}
                      size="sm"
                      aria-label={`Delete "${announcement.title}"`}
                    >
                      <Trash className="size-4" />
                    </ConfirmButton>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </>
  );
}
