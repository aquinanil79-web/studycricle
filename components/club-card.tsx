import Link from "next/link";
import { Check, Users } from "lucide-react";
import { Badge, CategoryBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CoverImage } from "@/components/ui/cover-image";
import type { Club } from "@/lib/types";

/**
 * Club summary card linking to the club page. Used on /clubs, the dashboard and the landing page.
 * Leave out `members` when it is unknown (visitors who are not logged in cannot read memberships).
 */
export function ClubCard({
  club,
  members,
  joined = false,
  href = `/clubs/${club.id}`,
}: {
  club: Club;
  members?: number;
  joined?: boolean;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine-600"
    >
      <Card interactive className="flex h-full flex-col overflow-hidden">
        <div className="relative">
          <CoverImage src={club.image_url} alt="" icon={Users} className="aspect-[16/9]" />
          {joined && (
            <Badge tone="pine" className="absolute top-3 right-3 shadow-xs">
              <Check className="size-3" /> Joined
            </Badge>
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <CategoryBadge category={club.category} className="self-start" />
          <h3 className="mt-3 text-xl font-semibold">{club.name}</h3>
          <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted">{club.description}</p>
          {members !== undefined && (
            <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-pine-700">
              <Users className="size-4" />
              {members} member{members === 1 ? "" : "s"}
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}
