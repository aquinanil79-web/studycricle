import type { Metadata } from "next";
import { CalendarDays, GraduationCap, IdCard, School, Shield } from "lucide-react";
import { ProfileForm } from "@/components/profile-form";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth";
import { YEARS } from "@/lib/constants";
import { db } from "@/lib/db";
import { club_members, event_registrations } from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const [[clubResult], [eventResult]] = await Promise.all([
    db.select({ value: count() }).from(club_members).where(eq(club_members.user_id, user.id)),
    db.select({ value: count() }).from(event_registrations).where(eq(event_registrations.user_id, user.id)),
  ]);
  const clubCount = clubResult?.value ?? 0;
  const eventCount = eventResult?.value ?? 0;

  const name = user.full_name || user.email;
  const isAdmin = user.role === "admin";
  const details = [
    { icon: IdCard, label: "Student ID", value: user.student_id },
    { icon: School, label: "Department", value: user.department },
    { icon: GraduationCap, label: "Year", value: YEARS.find((year) => year.value === user.year)?.label },
    { icon: CalendarDays, label: "Member since", value: formatDate(user.created_at) },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="My profile"
        description="Keep your details up to date so clubs and event organisers know who you are."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="animate-rise self-start overflow-hidden">
          <div className="bg-dots h-24 bg-pine-900" />
          <div className="relative -mt-12 flex flex-col items-center px-6 pb-6 text-center">
            <Avatar name={name} src={user.avatar_url} size="xl" className="ring-4 ring-surface" />
            <h2 className="mt-3 text-2xl font-semibold">{name}</h2>
            <p className="text-sm break-all text-muted">{user.email}</p>
            <Badge tone={isAdmin ? "marigold" : "pine"} className="mt-3">
              {isAdmin ? <Shield className="size-3" /> : <GraduationCap className="size-3" />}
              {isAdmin ? "Admin" : "Student"}
            </Badge>
            {user.bio && <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-ink/85">{user.bio}</p>}
          </div>

          <dl className="grid grid-cols-2 divide-x divide-line border-y border-line text-center">
            {/* flex-col-reverse shows the number above its label while keeping dt before dd */}
            <div className="flex flex-col-reverse py-4">
              <dt className="eyebrow text-muted">Clubs joined</dt>
              <dd className="font-display text-2xl font-semibold">{clubCount ?? 0}</dd>
            </div>
            <div className="flex flex-col-reverse py-4">
              <dt className="eyebrow text-muted">Events registered</dt>
              <dd className="font-display text-2xl font-semibold">{eventCount ?? 0}</dd>
            </div>
          </dl>

          <dl className="space-y-3 p-6 text-sm">
            {details.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2.5 text-muted">
                  <Icon className="size-4 shrink-0 text-pine-600" />
                  {label}
                </dt>
                <dd className={value ? "text-right font-medium" : "text-muted italic"}>{value || "Not set"}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="animate-rise lg:col-span-2" style={{ animationDelay: "80ms" }}>
          <CardHeader title="Edit profile" description="Changes show up across StudyCircle as soon as you save." />
          <ProfileForm profile={user} />
        </Card>
      </div>
    </>
  );
}
