import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone, Sparkles } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge, CategoryBadge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SearchFilter } from "@/components/ui/search-filter";
import { requireUser } from "@/lib/auth";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/constants";
import { db } from "@/lib/db";
import { announcements, profiles } from "@/lib/db/schema";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { cn, daysAgo, firstParam, formatDate, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Announcements" };

// Longer announcements start collapsed with a "Read more" toggle.
function isLong(content: string) {
  return content.length > 400 || content.split("\n").length > 6;
}

export default async function AnnouncementsPage({ searchParams }: PageProps<"/announcements">) {
  await requireUser();
  const params = await searchParams;
  const q = firstParam(params.q);
  const category = firstParam(params.category);

  const filters = [q ? or(ilike(announcements.title, `%${q}%`), ilike(announcements.content, `%${q}%`)) : undefined, category ? eq(announcements.category, category) : undefined].filter(Boolean);
  const [announcementRows, categoryRows] = await Promise.all([
    db.select({ id: announcements.id, title: announcements.title, content: announcements.content, category: announcements.category, author_id: announcements.author_id, created_at: announcements.created_at, updated_at: announcements.updated_at, author: { full_name: profiles.full_name, avatar_url: profiles.avatar_url } })
      .from(announcements).leftJoin(profiles, eq(announcements.author_id, profiles.id)).where(and(...filters)).orderBy(desc(announcements.created_at)),
    db.select({ category: announcements.category }).from(announcements),
  ]);
  const counts = new Map<string, number>();
  categoryRows.forEach((row) => counts.set(row.category, (counts.get(row.category) ?? 0) + 1));
  const newSince = Date.parse(daysAgo(3));

  const categoryLinks = [
    { label: "All", href: "/announcements", active: !category, count: categoryRows?.length ?? 0 },
    ...ANNOUNCEMENT_CATEGORIES.map((name) => ({
      label: name,
      href: `/announcements?category=${encodeURIComponent(name)}`,
      active: category === name,
      count: counts.get(name) ?? 0,
    })),
  ];

  return (
    <>
      <PageHeader
        eyebrow="Notice board"
        title="Announcements"
        description="Official news from the college: exams, placements, events and everything in between."
      />
      <SearchFilter
        action="/announcements"
        query={q}
        placeholder="Search announcements"
        filter={{ name: "category", label: "All categories", value: category, options: ANNOUNCEMENT_CATEGORIES }}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
        {announcementRows.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title={q || category ? "No announcements match your search" : "No announcements yet"}
            description={
              q || category ? "Try a different search term or category." : "News from the college admin will appear here."
            }
          />
        ) : (
          <ul className="space-y-4" role="list">
            {announcementRows.map((announcement, index) => {
              const author = announcement.author?.full_name || "StudyCircle Admin";
              const isNew = Date.parse(announcement.created_at) >= newSince;
              const long = isLong(announcement.content);
              return (
                <li key={announcement.id} className="animate-rise" style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
                  <Card className={cn("p-5 sm:p-6", isNew && "border-marigold-200")}>
                    <article>
                      <div className="flex flex-wrap items-center gap-2">
                        <CategoryBadge category={announcement.category} />
                        {isNew && (
                          <Badge tone="marigold">
                            <Sparkles className="size-3" /> New
                          </Badge>
                        )}
                        <time dateTime={announcement.created_at} className="ml-auto text-xs text-muted">
                          {formatDate(announcement.created_at)} · {timeAgo(announcement.created_at)}
                        </time>
                      </div>
                      <h2 className="mt-3 text-xl leading-snug font-semibold">{announcement.title}</h2>

                      {/* The native <details> only acts as the toggle: when it is open, the
                          group-has-[[open]] variant removes the line clamp from the text above it. */}
                      <div className="group/body mt-2">
                        <p
                          className={cn(
                            "leading-relaxed whitespace-pre-line text-ink/85",
                            long && "line-clamp-5 group-has-[[open]]/body:line-clamp-none",
                          )}
                        >
                          {announcement.content}
                        </p>
                        {long && (
                          <details className="group/more mt-1">
                            <summary className="w-fit cursor-pointer list-none rounded text-sm font-semibold text-pine-700 hover:text-pine-900 focus-visible:outline-2 focus-visible:outline-pine-600 [&::-webkit-details-marker]:hidden">
                              <span className="group-open/more:hidden">Read more</span>
                              <span className="hidden group-open/more:inline">Show less</span>
                            </summary>
                          </details>
                        )}
                      </div>

                      <div className="mt-4 flex items-center gap-2 border-t border-line pt-4 text-sm">
                        <Avatar name={author} src={announcement.author?.avatar_url} size="sm" />
                        <span className="text-muted">
                          Posted by <span className="font-medium text-ink">{author}</span>
                        </span>
                      </div>
                    </article>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}

        {/* Category shortcuts; on small screens the dropdown in the search bar does the same job. */}
        <Card className="hidden self-start lg:block">
          <CardHeader title="Categories" />
          <nav aria-label="Announcement categories" className="p-2">
            <ul role="list">
              {categoryLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    aria-current={item.active ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      "focus-visible:outline-2 focus-visible:outline-pine-600",
                      item.active ? "bg-pine-800 text-paper" : "text-ink hover:bg-pine-50",
                    )}
                  >
                    {item.label}
                    <span className={cn("text-xs", item.active ? "text-pine-200" : "text-muted")}>{item.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Card>
      </div>
    </>
  );
}
