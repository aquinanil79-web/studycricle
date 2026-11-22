import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus, Trash, Users } from "lucide-react";
import { ClubFields } from "@/components/admin/club-fields";
import { ConfirmButton } from "@/components/ui/action-button";
import { CategoryBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CoverImage } from "@/components/ui/cover-image";
import { EmptyState } from "@/components/ui/empty-state";
import { FormModal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { SearchFilter } from "@/components/ui/search-filter";
import { createClub, deleteClub, updateClub } from "@/lib/actions/clubs";
import { requireAdmin } from "@/lib/auth";
import { CLUB_CATEGORIES } from "@/lib/constants";
import { db } from "@/lib/db";
import { club_members, clubs } from "@/lib/db/schema";
import { and, asc, count, eq, ilike } from "drizzle-orm";
import { embeddedCount, firstParam, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Manage clubs" };

const th = "eyebrow px-5 py-3 text-muted";

export default async function AdminClubsPage({ searchParams }: PageProps<"/admin/clubs">) {
  await requireAdmin();
  const params = await searchParams;
  const q = firstParam(params.q);
  const category = firstParam(params.category);

  const filters = [q ? ilike(clubs.name, `%${q}%`) : undefined, category ? eq(clubs.category, category) : undefined].filter(Boolean);
  const [clubRows, memberCounts] = await Promise.all([
    db.select().from(clubs).where(and(...filters)).orderBy(asc(clubs.name)),
    db.select({ club_id: club_members.club_id, count: count() }).from(club_members).groupBy(club_members.club_id),
  ]);
  const counts = new Map(memberCounts.map((row) => [row.club_id, row.count]));
  const clubList = clubRows.map((club) => ({ ...club, club_members: [{ count: counts.get(club.id) ?? 0 }] }));

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Manage clubs"
        description="Create clubs, keep their details up to date and remove clubs that are no longer active."
        action={
          <FormModal
            trigger={
              <>
                <Plus className="size-4" /> New club
              </>
            }
            title="New club"
            description="Students can find and join it as soon as it is created."
            action={createClub}
            submitLabel="Create club"
            size="lg"
          >
            <ClubFields />
          </FormModal>
        }
      />
      <SearchFilter
        action="/admin/clubs"
        query={q}
        placeholder="Search clubs by name or description"
        filter={{ name: "category", label: "All categories", value: category, options: CLUB_CATEGORIES }}
      />

      {clubList.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q || category ? "No clubs match your search" : "No clubs yet"}
          description={q || category ? "Try a different search term or category." : "Create the first club with the New club button."}
        />
      ) : (
        <Card className="animate-rise overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-2xl text-left text-sm">
              <caption className="sr-only">Clubs</caption>
              <thead className="border-b border-line bg-paper/60">
                <tr>
                  <th scope="col" className={th}>Club</th>
                  <th scope="col" className={th}>Category</th>
                  <th scope="col" className={th}>Members</th>
                  <th scope="col" className={th}>Created</th>
                  <th scope="col" className={th}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {clubList.map((club) => (
                  <tr key={club.id} className="transition-colors hover:bg-pine-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {/* The arbitrary variant shrinks CoverImage's fallback icon to fit the small thumbnail. */}
                        <CoverImage
                          src={club.image_url}
                          alt=""
                          icon={Users}
                          sizes="48px"
                          className="size-12 shrink-0 rounded-lg [&_svg]:size-5"
                        />
                        <Link
                          href={`/clubs/${club.id}`}
                          className="rounded-sm font-semibold text-ink hover:text-pine-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine-600"
                        >
                          {club.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <CategoryBadge category={club.category} />
                    </td>
                    <td className="px-5 py-3 font-medium tabular-nums">{embeddedCount(club.club_members)}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-muted">{formatDate(club.created_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <FormModal
                          trigger={<Pencil className="size-4" />}
                          triggerProps={{ variant: "ghost", size: "sm", "aria-label": `Edit ${club.name}` }}
                          title="Edit club"
                          description={club.name}
                          action={updateClub.bind(null, club.id)}
                          submitLabel="Save changes"
                          size="lg"
                        >
                          <ClubFields club={club} />
                        </FormModal>
                        <ConfirmButton
                          action={deleteClub.bind(null, club.id)}
                          title={`Delete ${club.name}?`}
                          description="All memberships and comments of this club will be removed too. This cannot be undone."
                          confirmLabel="Delete club"
                          size="sm"
                          className="text-muted hover:text-brick-600"
                          aria-label={`Delete ${club.name}`}
                        >
                          <Trash className="size-4" />
                        </ConfirmButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
