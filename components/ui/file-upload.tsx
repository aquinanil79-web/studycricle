"use client";

import { useId, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { CircleCheck, ImagePlus, LoaderCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import { BUCKETS, type BucketName } from "@/lib/constants";
import { cn, formatFileSize, isAllowedImageUrl } from "@/lib/utils";
import { useActionForm } from "./action-form";

// Files go straight from the browser to Supabase Storage (protected by the
// storage policies in supabase/schema.sql). Only the resulting URL or path is
// sent to the Server Action, so uploads are not limited by the 1 MB Server
// Action body size.
// ponytail: a file uploaded for a form that is then cancelled stays in the bucket;
// add a cleanup job if storage space ever matters.

type UploadedFile = { path: string; name: string; size: number; type: string };

async function uploadFile(bucket: BucketName, folder: string, file: File): Promise<(UploadedFile & { url: string }) | null> {
  const { maxSizeMB } = BUCKETS[bucket];
  if (file.size > maxSizeMB * 1024 * 1024) {
    toast.error(`File is too large. The limit is ${maxSizeMB} MB.`);
    return null;
  }

  const body = new FormData();
  body.set("bucket", bucket);
  body.set("folder", folder);
  body.set("file", file);
  const response = await fetch("/api/uploads", { method: "POST", body });
  const result = await response.json();
  if (!response.ok) {
    toast.error(result.error ?? "Upload failed. Please try again.");
    return null;
  }
  return result as UploadedFile & { url: string };
}

/**
 * Image picker for avatars and club/event covers.
 * Submits the image's public URL in a hidden input called `name`.
 *
 * folder: the user's id for "avatars", any folder name (e.g. "clubs") for "images".
 */
export function ImageUpload({
  name,
  label,
  bucket,
  folder,
  defaultValue,
  shape = "wide",
}: {
  name: string;
  label: string;
  bucket: "avatars" | "images";
  folder: string;
  defaultValue?: string | null;
  shape?: "wide" | "round";
}) {
  const id = useId();
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const error = useActionForm().errors[name]?.[0];

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const uploaded = await uploadFile(bucket, folder, file);
    if (uploaded) {
      setUrl(uploaded.url);
    }
    setUploading(false);
    event.target.value = "";
  }

  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-ink">{label}</span>
      <input type="hidden" name={name} value={url} />
      <label
        htmlFor={id}
        className={cn(
          "relative flex cursor-pointer items-center justify-center overflow-hidden border border-dashed border-line bg-white text-muted transition-colors hover:border-pine-400 hover:text-pine-700",
          "has-focus-visible:outline-2 has-focus-visible:outline-pine-600",
          shape === "round" ? "size-28 rounded-full" : "aspect-video w-full rounded-xl",
        )}
      >
        {url && isAllowedImageUrl(url) && <Image src={url} alt="" fill sizes="(min-width: 640px) 480px, 100vw" className="object-cover" />}
        <span
          className={cn(
            "relative flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium",
            url && "bg-surface/90 text-ink",
          )}
        >
          {uploading ? <LoaderCircle className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
          {uploading ? "Uploading..." : url ? "Change" : "Choose image"}
        </span>
        <input
          id={id}
          type="file"
          accept={BUCKETS[bucket].accept}
          onChange={handleChange}
          disabled={uploading}
          aria-label={label}
          className="sr-only"
        />
      </label>
      <p className="text-xs text-muted">PNG, JPG or WebP, up to {BUCKETS[bucket].maxSizeMB} MB.</p>
      {error && (
        <p role="alert" className="text-xs font-medium text-brick-600">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * File picker for study resources (private "resources" bucket).
 * Submits hidden inputs file_path, file_name, file_size and file_type.
 *
 * folder: must be the uploading user's id (required by the storage policy).
 */
export function ResourceFileUpload({ folder }: { folder: string }) {
  const id = useId();
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const error = useActionForm().errors.file_path?.[0];
  const { accept, maxSizeMB } = BUCKETS.resources;

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setUploading(true);
    const uploaded = await uploadFile("resources", folder, selected);
    if (uploaded) setFile(uploaded);
    setUploading(false);
    event.target.value = "";
  }

  return (
    <div className="space-y-1.5">
      <span className="block text-sm font-medium text-ink">
        File<span className="text-brick-600"> *</span>
      </span>
      <input type="hidden" name="file_path" value={file?.path ?? ""} />
      <input type="hidden" name="file_name" value={file?.name ?? ""} />
      <input type="hidden" name="file_size" value={file?.size ?? ""} />
      <input type="hidden" name="file_type" value={file?.type ?? ""} />
      <label
        htmlFor={id}
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-xl border border-dashed bg-white px-4 py-4 text-sm transition-colors hover:border-pine-400",
          "has-focus-visible:outline-2 has-focus-visible:outline-pine-600",
          error ? "border-brick-500" : "border-line",
        )}
      >
        {uploading ? (
          <LoaderCircle className="size-5 shrink-0 animate-spin text-muted" />
        ) : file ? (
          <CircleCheck className="size-5 shrink-0 text-pine-600" />
        ) : (
          <Upload className="size-5 shrink-0 text-muted" />
        )}
        <span className="min-w-0">
          <span className="block truncate font-medium text-ink">
            {uploading ? "Uploading..." : file ? file.name : "Choose a file"}
          </span>
          <span className="block text-xs text-muted">
            {file && !uploading
              ? `${formatFileSize(file.size)} - uploaded, click to replace`
              : `PDF, Office documents, text or images, up to ${maxSizeMB} MB`}
          </span>
        </span>
        <input
          id={id}
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={uploading}
          aria-label="File"
          className="sr-only"
        />
      </label>
      {error && (
        <p role="alert" className="text-xs font-medium text-brick-600">
          {error}
        </p>
      )}
    </div>
  );
}
