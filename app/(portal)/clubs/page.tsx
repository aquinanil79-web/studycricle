import type { Metadata } from "next";
import { Users } from "lucide-react";
import { ClubCard } from "@/components/club-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SearchFilter } from "@/components/ui/search-filter";
import { requireUser } from "@/lib/auth";
import { CLUB_CATEGORIES } from "@/lib/constants";
import { db } from "@/lib/db";
import { club_members, clubs } from "@/lib/db/schema";
import { and, asc, count, eq, ilike } from "drizzle-orm";
import { embeddedCount, firstParam } from "@/lib/utils";

export const metadata: Metadata = { title: "Clubs" };

export default async function ClubsPage({ searchParams }: PageProps<"/clubs">) {
  const user = await requireUser();
  const params = await searchParams;
  const q = firstParam(params.q);
  const category = firstParam(params.category);

  const filters = [
    q ? ilike(clubs.name, `%${q}%`) : undefined,
    category ? eq(clubs.category, category) : undefined,
  ].filter(Boolean);
  const [clubRows, memberCounts, memberships] = await Promise.all([
    db.select().from(clubs).where(and(...filters)).orderBy(asc(clubs.name)),
    db.select({ club_id: club_members.club_id, count: count() }).from(club_members).groupBy(club_members.club_id),
    db.select({ club_id: club_members.club_id }).from(club_members).where(eq(club_members.user_id, user.id)),
  ]);
  const counts = new Map(memberCounts.map((row) => [row.club_id, row.count]));
  const clubList = clubRows.map((club) => ({ ...club, club_members: [{ count: counts.get(club.id) ?? 0 }] }));
  const joined = new Set(memberships.map((membership) => membership.club_id));

  return (
    <>
      <PageHeader
        eyebrow="Explore"
        title="Clubs & societies"
        description="Find your people. Join clubs to get updates and take part in their events."
      />
      <SearchFilter
        action="/clubs"
        query={q}
        placeholder="Search clubs by name or description"
        filter={{ name: "category", label: "All categories", value: category, options: CLUB_CATEGORIES }}
      />

      {clubList.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q || category ? "No clubs match your search" : "No clubs yet"}
          description={q || category ? "Try a different search term or category." : "Clubs created by the admin will appear here."}
        />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" role="list">
          {clubList.map((club, index) => (
            <li key={club.id} className="animate-rise" style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
              <ClubCard club={club} members={embeddedCount(club.club_members)} joined={joined.has(club.id)} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
