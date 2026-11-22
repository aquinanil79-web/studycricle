import type { Metadata } from "next";
import { GraduationCap, ShieldCheck, ShieldOff, Trash } from "lucide-react";
import { ActionButton, ConfirmButton } from "@/components/ui/action-button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SearchFilter } from "@/components/ui/search-filter";
import { deleteStudent, setUserRole } from "@/lib/actions/students";
import { requireAdmin } from "@/lib/auth";
import { DEPARTMENTS, YEARS } from "@/lib/constants";
import { db } from "@/lib/db";
import { club_members, event_registrations, profiles } from "@/lib/db/schema";
import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { embeddedCount, firstParam, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Manage students" };

const columns = ["Student", "Student ID", "Department", "Year", "Role", "Clubs", "Events", "Joined"];

export default async function AdminStudentsPage({ searchParams }: PageProps<"/admin/students">) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const q = firstParam(params.q);
  const department = firstParam(params.department);

  const filters = [
    q ? or(ilike(profiles.full_name, `%${q}%`), ilike(profiles.email, `%${q}%`), ilike(profiles.student_id, `%${q}%`)) : undefined,
    department ? eq(profiles.department, department) : undefined,
  ].filter(Boolean);
  const [profileRows, clubCounts, eventCounts] = await Promise.all([
    db.select().from(profiles).where(and(...filters)).orderBy(desc(profiles.created_at)),
    db.select({ user_id: club_members.user_id, count: count() }).from(club_members).groupBy(club_members.user_id),
    db.select({ user_id: event_registrations.user_id, count: count() }).from(event_registrations).groupBy(event_registrations.user_id),
  ]);
  const clubCountByUser = new Map(clubCounts.map((row) => [row.user_id, row.count]));
  const eventCountByUser = new Map(eventCounts.map((row) => [row.user_id, row.count]));
  const profileList = profileRows.map((profile) => ({
    ...profile,
    club_members: [{ count: clubCountByUser.get(profile.id) ?? 0 }],
    event_registrations: [{ count: eventCountByUser.get(profile.id) ?? 0 }],
  }));
  const total = profileList.length;
  const filtered = Boolean(q || department);

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Students"
        description="Everyone with a StudyCircle account. Give trusted students admin rights or remove accounts that should no longer exist."
      />
      <SearchFilter
        action="/admin/students"
        query={q}
        placeholder="Search by name, email or student ID"
        filter={{ name: "department", label: "All departments", value: department, options: DEPARTMENTS }}
      />

      {profileList.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={filtered ? "No students match your search" : "No students yet"}
          description={filtered ? "Try a different name, ID or department." : "Accounts appear here as soon as students register."}
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-muted">
            {total} account{total === 1 ? "" : "s"}
            {filtered && " found"}
          </p>
          <Card className="animate-rise overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-paper/60">
                <tr>
                  {columns.map((column) => (
                    <th key={column} scope="col" className="eyebrow px-4 py-3 whitespace-nowrap text-muted">
                      {column}
                    </th>
                  ))}
                  <th scope="col" className="eyebrow px-4 py-3 text-right text-muted">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {profileList.map((profile) => {
                  const name = profile.full_name || profile.email;
                  const isAdmin = profile.role === "admin";
                  return (
                    <tr key={profile.id} className="transition-colors hover:bg-pine-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={name} src={profile.avatar_url} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium whitespace-nowrap">{name}</p>
                            <p className="text-xs whitespace-nowrap text-muted">{profile.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{profile.student_id ?? "-"}</td>
                      <td className="max-w-52 min-w-40 px-4 py-3 text-ink/80">{profile.department ?? "-"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {YEARS.find((year) => year.value === profile.year)?.label ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={isAdmin ? "marigold" : "pine"}>{isAdmin ? "Admin" : "Student"}</Badge>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{embeddedCount(profile.club_members)}</td>
                      <td className="px-4 py-3 tabular-nums">{embeddedCount(profile.event_registrations)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDate(profile.created_at)}</td>
                      <td className="px-4 py-3">
                        {profile.id === admin.id ? (
                          <p className="text-right text-xs font-medium text-muted">You</p>
                        ) : (
                          <div className="flex justify-end gap-2">
                            {/* The sr-only name tells screen reader users which row a button belongs to. */}
                            <ActionButton
                              action={setUserRole.bind(null, profile.id, isAdmin ? "student" : "admin")}
                              variant="outline"
                              size="sm"
                            >
                              {isAdmin ? <ShieldOff className="size-4" /> : <ShieldCheck className="size-4" />}
                              {isAdmin ? "Remove admin" : "Make admin"}
                              <span className="sr-only">: {name}</span>
                            </ActionButton>
                            {!isAdmin && (
                              <ConfirmButton
                                action={deleteStudent.bind(null, profile.id)}
                                title={`Remove ${name}?`}
                                description="Their account, club memberships, event registrations, comments and uploaded resources will be deleted permanently. This cannot be undone."
                                confirmLabel="Remove student"
                                size="sm"
                                className="text-brick-600! hover:bg-brick-50!"
                              >
                                <Trash className="size-4" /> Remove
                                <span className="sr-only">: {name}</span>
                              </ConfirmButton>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </>
  );
}
