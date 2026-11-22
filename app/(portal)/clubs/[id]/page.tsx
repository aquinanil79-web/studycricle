import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, LogOut, Plus, Users } from "lucide-react";
import { Comments } from "@/components/comments";
import { ActionButton, ConfirmButton } from "@/components/ui/action-button";
import { Avatar } from "@/components/ui/avatar";
import { CategoryBadge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { CoverImage } from "@/components/ui/cover-image";
import { joinClub, leaveClub } from "@/lib/actions/clubs";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { club_members, clubs, profiles } from "@/lib/db/schema";
import { and, count, desc, eq } from "drizzle-orm";
import { formatDate } from "@/lib/utils";
import { idSchema } from "@/lib/validation";

async function getClub(id: string) {
  if (!idSchema.safeParse(id).success) return null;
  const [club] = await db.select().from(clubs).where(eq(clubs.id, id)).limit(1);
  if (!club) return null;
  const [{ value: memberCount }] = await db.select({ value: count() }).from(club_members).where(eq(club_members.club_id, id));
  return { ...club, memberCount };
}

export async function generateMetadata({ params }: PageProps<"/clubs/[id]">): Promise<Metadata> {
  const club = await getClub((await params).id);
  return { title: club?.name ?? "Club not found" };
}

export default async function ClubPage({ params }: PageProps<"/clubs/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const club = await getClub(id);
  if (!club) notFound();

  const [members, [membership]] = await Promise.all([
    db.select({ user_id: club_members.user_id, member: { full_name: profiles.full_name, avatar_url: profiles.avatar_url, department: profiles.department } })
      .from(club_members).leftJoin(profiles, eq(club_members.user_id, profiles.id))
      .where(eq(club_members.club_id, club.id)).orderBy(desc(club_members.joined_at)).limit(8),
    db.select({ id: club_members.id }).from(club_members).where(and(eq(club_members.club_id, club.id), eq(club_members.user_id, user.id))).limit(1),
  ]);
  const memberCount = club.memberCount;
  const isMember = Boolean(membership);

  return (
    <>
      <Link href="/clubs" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> All clubs
      </Link>

      <Card className="animate-rise overflow-hidden">
        <CoverImage src={club.image_url} alt={club.name} icon={Users} preload sizes="(min-width: 1280px) 1200px, 100vw" className="aspect-[21/9] max-h-80 w-full" />
        <div className="flex flex-wrap items-end justify-between gap-6 p-6 sm:p-8">
          <div className="max-w-2xl">
            <CategoryBadge category={club.category} />
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{club.name}</h1>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <Users className="size-4" /> {memberCount} member{memberCount === 1 ? "" : "s"}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4" /> Created {formatDate(club.created_at)}
              </span>
            </div>
          </div>
          {isMember ? (
            <ConfirmButton
              action={leaveClub.bind(null, club.id)}
              title={`Leave ${club.name}?`}
              description="You can join again at any time."
              confirmLabel="Leave club"
              variant="outline"
            >
              <LogOut className="size-4" /> Leave club
            </ConfirmButton>
          ) : (
            <ActionButton action={joinClub.bind(null, club.id)} variant="accent" size="lg">
              <Plus className="size-4" /> Join club
            </ActionButton>
          )}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold">About the club</h2>
            <p className="mt-3 leading-relaxed whitespace-pre-line text-ink/85">{club.description}</p>
          </Card>
          <Comments target="club" targetId={club.id} />
        </div>

        <Card className="self-start">
          <CardHeader title="Members" description={memberCount ? "Most recent first" : undefined} />
          {members?.length ? (
            <ul className="divide-y divide-line" role="list">
              {members.map(({ user_id, member }) => (
                <li key={user_id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar name={member?.full_name || "Student"} src={member?.avatar_url} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {member?.full_name || "Student"}
                      {user_id === user.id && <span className="text-muted"> (you)</span>}
                    </p>
                    {member?.department && <p className="truncate text-xs text-muted">{member.department}</p>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 text-sm text-muted">No members yet. Be the first to join!</p>
          )}
          {memberCount > 8 && <p className="border-t border-line px-5 py-3 text-xs text-muted">and {memberCount - 8} more</p>}
        </Card>
      </div>
    </>
  );
}
