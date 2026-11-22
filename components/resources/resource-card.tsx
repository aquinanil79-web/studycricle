import { Download, ExternalLink, File as FileIcon, FileImage, FileSpreadsheet, FileText, Pencil, Presentation, Trash } from "lucide-react";
import { ConfirmButton } from "@/components/ui/action-button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/action-form";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormModal } from "@/components/ui/modal";
import { deleteResource, updateResource } from "@/lib/actions/resources";
import { RESOURCE_SUBJECTS } from "@/lib/constants";
import type { Resource } from "@/lib/types";
import { cn, formatFileSize, timeAgo } from "@/lib/utils";

// Icon and colours per kind of file (full class strings so Tailwind can find them).
const kinds = {
  pdf: { icon: FileText, tone: "bg-brick-50 text-brick-600" },
  doc: { icon: FileText, tone: "bg-sky-50 text-sky-700" },
  sheet: { icon: FileSpreadsheet, tone: "bg-pine-50 text-pine-700" },
  slides: { icon: Presentation, tone: "bg-marigold-50 text-marigold-700" },
  image: { icon: FileImage, tone: "bg-violet-50 text-violet-700" },
  other: { icon: FileIcon, tone: "bg-ink/5 text-muted" },
};

// The upload keeps the original extension, which matches the bucket's allowed types.
const kindByExtension: Record<string, keyof typeof kinds> = {
  pdf: "pdf",
  doc: "doc",
  docx: "doc",
  txt: "doc",
  xls: "sheet",
  xlsx: "sheet",
  ppt: "slides",
  pptx: "slides",
  png: "image",
  jpg: "image",
  jpeg: "image",
};

function fileInfo({ file_name, file_type }: Pick<Resource, "file_name" | "file_type">) {
  const extension = file_name.includes(".") ? file_name.split(".").pop()!.toLowerCase() : "";
  const kind = kindByExtension[extension] ?? (file_type?.startsWith("image/") ? "image" : "other");
  return { ...kinds[kind], extension: extension.toUpperCase() || "FILE" };
}

/** Title, subject and description inputs, shared by the upload and edit forms. */
export function ResourceFields({ resource }: { resource?: Resource }) {
  return (
    <>
      <TextField label="Title" name="title" defaultValue={resource?.title} required minLength={3} maxLength={120} placeholder="e.g. DBMS unit 3 notes" />
      <SelectField
        label="Subject"
        name="subject"
        options={RESOURCE_SUBJECTS}
        placeholder="Select a subject"
        defaultValue={resource?.subject ?? ""}
        required
      />
      <TextAreaField
        label="Description"
        name="description"
        defaultValue={resource?.description ?? ""}
        maxLength={500}
        rows={3}
        hint="Optional. What does it cover, and who is it useful for?"
      />
    </>
  );
}

type ResourceWithUploader = Resource & { uploader: { full_name: string; avatar_url: string | null } | null };

/** One shared file with View/Download links, plus Edit/Delete for its uploader and admins. */
export function ResourceCard({ resource, canManage }: { resource: ResourceWithUploader; canManage: boolean }) {
  const { icon: Icon, tone, extension } = fileInfo(resource);
  const uploader = resource.uploader?.full_name || "Student";
  const fileUrl = `/resources/${resource.id}/file`;

  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex gap-4">
        <div className={cn("flex size-12 shrink-0 flex-col items-center justify-center rounded-xl", tone)}>
          <Icon className="size-5" />
          <span className="text-[0.6rem] leading-tight font-bold tracking-wide">{extension}</span>
        </div>
        <div className="min-w-0 flex-1">
          <Badge tone="pine">{resource.subject}</Badge>
          <h3 className="mt-1.5 text-lg leading-snug font-semibold wrap-break-word">{resource.title}</h3>
          {resource.description && (
            <p className="mt-1 line-clamp-3 text-sm whitespace-pre-line text-muted">{resource.description}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-muted">
        <Avatar name={uploader} src={resource.uploader?.avatar_url} size="sm" />
        <span className="min-w-0 truncate">
          <span className="font-medium text-ink">{uploader}</span> ·{" "}
          <time dateTime={resource.created_at}>{timeAgo(resource.created_at)}</time> · {formatFileSize(resource.file_size)}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        {/* Plain <a> tags: these routes redirect to the file itself, not to a page. */}
        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className={buttonStyles({ variant: "outline", size: "sm" })}>
          <ExternalLink className="size-3.5" /> View
        </a>
        <a href={`${fileUrl}?download=1`} className={buttonStyles({ size: "sm" })}>
          <Download className="size-3.5" /> Download
        </a>

        {canManage && (
          <div className="ml-auto flex gap-1">
            <FormModal
              trigger={<Pencil className="size-4" />}
              triggerProps={{ variant: "ghost", size: "sm", "aria-label": `Edit ${resource.title}`, className: "text-muted hover:text-ink" }}
              title="Edit resource"
              description="The file stays the same; only its details change."
              action={updateResource.bind(null, resource.id)}
            >
              <ResourceFields resource={resource} />
            </FormModal>
            <ConfirmButton
              action={deleteResource.bind(null, resource.id)}
              title="Delete resource?"
              description={`"${resource.title}" and its file will be removed for everyone.`}
              size="sm"
              aria-label={`Delete ${resource.title}`}
              className="text-muted hover:text-brick-600"
            >
              <Trash className="size-4" />
            </ConfirmButton>
          </div>
        )}
      </div>
    </Card>
  );
}
