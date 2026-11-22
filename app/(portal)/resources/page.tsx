import type { Metadata } from "next";
import { BookOpen, Upload } from "lucide-react";
import { ResourceCard, ResourceFields } from "@/components/resources/resource-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ResourceFileUpload } from "@/components/ui/file-upload";
import { FormModal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { SearchFilter } from "@/components/ui/search-filter";
import { createResource } from "@/lib/actions/resources";
import { requireUser } from "@/lib/auth";
import { RESOURCE_SUBJECTS } from "@/lib/constants";
import { db } from "@/lib/db";
import { profiles, resources } from "@/lib/db/schema";
import { and, desc, eq, ilike } from "drizzle-orm";
import { firstParam } from "@/lib/utils";

export const metadata: Metadata = { title: "Resources" };

export default async function ResourcesPage({ searchParams }: PageProps<"/resources">) {
  const user = await requireUser();
  const params = await searchParams;
  const q = firstParam(params.q);
  const subject = firstParam(params.subject);

  const conditions = [q ? ilike(resources.title, `%${q}%`) : undefined, subject ? eq(resources.subject, subject) : undefined].filter(Boolean);
  const resourceRows = await db.select({
    id: resources.id, title: resources.title, description: resources.description, subject: resources.subject,
    file_path: resources.file_path, file_name: resources.file_name, file_size: resources.file_size, file_type: resources.file_type,
    uploaded_by: resources.uploaded_by, created_at: resources.created_at,
    uploader: { full_name: profiles.full_name, avatar_url: profiles.avatar_url },
  }).from(resources).leftJoin(profiles, eq(resources.uploaded_by, profiles.id)).where(and(...conditions)).orderBy(desc(resources.created_at));

  // The file goes to Storage first (into the user's own folder), then the form saves its details.
  const uploadButton = (
    <FormModal
      trigger={
        <>
          <Upload className="size-4" /> Upload resource
        </>
      }
      triggerProps={{ variant: "accent" }}
      title="Upload a resource"
      description="Share notes, slides or papers with every student on StudyCircle."
      action={createResource}
      submitLabel="Share resource"
    >
      <ResourceFileUpload folder={user.id} />
      <ResourceFields />
    </FormModal>
  );

  return (
    <>
      <PageHeader
        eyebrow="Study material"
        title="Resources"
        description="Notes, slides and question papers shared by students. Upload yours to help others."
        action={uploadButton}
      />
      <SearchFilter
        action="/resources"
        query={q}
        placeholder="Search by title or description"
        filter={{ name: "subject", label: "All subjects", value: subject, options: RESOURCE_SUBJECTS }}
      />

      {resourceRows.length === 0 ? (
        q || subject ? (
          <EmptyState icon={BookOpen} title="No resources match your search" description="Try a different search term or subject." />
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No resources yet"
            description="Be the first to share your notes. Everyone on StudyCircle will be able to view and download them."
            action={uploadButton}
          />
        )
      ) : (
        <ul className="grid gap-5 lg:grid-cols-2" role="list">
          {resourceRows.map((resource, index) => (
            <li key={resource.id} className="animate-rise" style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
              <ResourceCard resource={resource} canManage={resource.uploaded_by === user.id || user.role === "admin"} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
