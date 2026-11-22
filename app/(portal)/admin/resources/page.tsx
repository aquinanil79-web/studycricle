import type { Metadata } from "next";
import { Download, Eye, FileText, HardDrive, Pencil, Trash, Users } from "lucide-react";
import { ResourceFields } from "@/components/resources/resource-card";
import { ConfirmButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormModal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { SearchFilter } from "@/components/ui/search-filter";
import { StatCard } from "@/components/ui/stat-card";
import { deleteResource, updateResource } from "@/lib/actions/resources";
import { requireAdmin } from "@/lib/auth";
import { RESOURCE_SUBJECTS } from "@/lib/constants";
import { db } from "@/lib/db";
import { profiles, resources } from "@/lib/db/schema";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { firstParam, formatDate, formatFileSize } from "@/lib/utils";

export const metadata: Metadata = { title: "Manage resources" };

const iconLink = buttonStyles({ variant: "ghost", size: "sm" });

export default async function AdminResourcesPage({ searchParams }: PageProps<"/admin/resources">) {
  await requireAdmin();
  const params = await searchParams;
  const q = firstParam(params.q);
  const subject = firstParam(params.subject);

  const filters = [
    q ? or(ilike(resources.title, `%${q}%`), ilike(resources.description, `%${q}%`), ilike(resources.file_name, `%${q}%`)) : undefined,
    subject ? eq(resources.subject, subject) : undefined,
  ].filter(Boolean);
  const [resourceRows, totals] = await Promise.all([
    db.select({ id: resources.id, title: resources.title, description: resources.description, subject: resources.subject, file_path: resources.file_path, file_name: resources.file_name, file_size: resources.file_size, file_type: resources.file_type, uploaded_by: resources.uploaded_by, created_at: resources.created_at, uploader: { full_name: profiles.full_name, email: profiles.email } }).from(resources)
      .leftJoin(profiles, eq(resources.uploaded_by, profiles.id)).where(and(...filters)).orderBy(desc(resources.created_at)),
    db.select({ file_size: resources.file_size, uploaded_by: resources.uploaded_by }).from(resources),
  ]);

  const stats = [
    { label: "Resources", value: totals.length, icon: FileText, tone: "pine" },
    {
      label: "Storage used",
      value: formatFileSize(totals.reduce((sum, row) => sum + row.file_size, 0)),
      icon: HardDrive,
      tone: "marigold",
    },
    { label: "Contributors", value: new Set(totals.map((row) => row.uploaded_by)).size, icon: Users, tone: "sky" },
  ] as const;

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Resources"
        description="Every file students have shared. Fix wrong details or remove files that break the rules."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {stats.map((stat, index) => (
          <div key={stat.label} className="animate-rise" style={{ animationDelay: `${index * 60}ms` }}>
            <StatCard {...stat} />
          </div>
        ))}
      </div>

      <SearchFilter
        action="/admin/resources"
        query={q}
        placeholder="Search by title, description or file name"
        filter={{ name: "subject", label: "All subjects", value: subject, options: RESOURCE_SUBJECTS }}
      />

      {resourceRows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={q || subject ? "No resources match your search" : "No resources uploaded yet"}
          description={
            q || subject
              ? "Try a different search term or subject."
              : "Files that students share on the Resources page will appear here."
          }
        />
      ) : (
        <Card className="animate-rise overflow-hidden">
          {/* On small screens the table scrolls sideways instead of squashing the columns. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-3xl text-left text-sm">
              <caption className="sr-only">Uploaded resources</caption>
              <thead className="border-b border-line bg-paper/70 text-muted">
                <tr>
                  <th scope="col" className="eyebrow px-5 py-3">Resource</th>
                  <th scope="col" className="eyebrow px-5 py-3">Subject</th>
                  <th scope="col" className="eyebrow px-5 py-3">Uploaded by</th>
                  <th scope="col" className="eyebrow px-5 py-3 text-right">Size</th>
                  <th scope="col" className="eyebrow px-5 py-3">Uploaded</th>
                  <th scope="col" className="px-5 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {resourceRows.map((resource) => (
                  <tr key={resource.id} className="align-top transition-colors hover:bg-pine-50/40">
                    <td className="max-w-xs px-5 py-4">
                      <p className="font-medium text-ink">{resource.title}</p>
                      <p className="truncate text-xs text-muted">{resource.file_name}</p>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone="pine">{resource.subject}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium">{resource.uploader?.full_name || "Student"}</p>
                      <p className="text-xs text-muted">{resource.uploader?.email}</p>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap tabular-nums">
                      {formatFileSize(resource.file_size)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <time dateTime={resource.created_at}>{formatDate(resource.created_at)}</time>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        {/* Plain <a>: /resources/[id]/file is a Route Handler that redirects to a signed URL. */}
                        <a
                          href={`/resources/${resource.id}/file`}
                          target="_blank"
                          rel="noopener"
                          aria-label={`View "${resource.title}" (opens in a new tab)`}
                          className={iconLink}
                        >
                          <Eye className="size-4" />
                        </a>
                        <a
                          href={`/resources/${resource.id}/file?download=1`}
                          aria-label={`Download "${resource.title}"`}
                          className={iconLink}
                        >
                          <Download className="size-4" />
                        </a>
                        <FormModal
                          trigger={<Pencil className="size-4" />}
                          triggerProps={{ variant: "ghost", size: "sm", "aria-label": `Edit "${resource.title}"` }}
                          title="Edit resource details"
                          description="Only the details change; the uploaded file stays the same."
                          action={updateResource.bind(null, resource.id)}
                          submitLabel="Save changes"
                        >
                          <ResourceFields resource={resource} />
                        </FormModal>
                        <ConfirmButton
                          action={deleteResource.bind(null, resource.id)}
                          title="Delete resource?"
                          description={`"${resource.title}" will be removed, and the file ${resource.file_name} will be permanently deleted from storage. This cannot be undone.`}
                          size="sm"
                          aria-label={`Delete "${resource.title}"`}
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
