import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { media_objects } from "@/lib/db/schema";
import { BUCKETS } from "@/lib/constants";

const categoryMap = { avatars: "avatar", images: "image", resources: "resource" } as const;
type UploadBucket = keyof typeof categoryMap;

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.formData();
  const bucket = body.get("bucket");
  const folder = body.get("folder");
  const file = body.get("file");
  if (typeof bucket !== "string" || !(bucket in categoryMap) || typeof folder !== "string" || !(file instanceof File)) {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }
  const key = bucket as UploadBucket;
  if (key === "avatars" && folder !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (key === "images" && user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (file.size === 0 || file.size > BUCKETS[key].maxSizeMB * 1024 * 1024) return NextResponse.json({ error: "File size is not allowed" }, { status: 413 });
  const allowedTypes = key === "resources"
    ? new Set(["application/pdf", "text/plain", "image/png", "image/jpeg", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"])
    : new Set(["image/png", "image/jpeg", "image/webp"]);
  if (!allowedTypes.has(file.type)) return NextResponse.json({ error: "File type is not allowed" }, { status: 415 });

  const extension = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "") : "bin";
  const path = `${folder}/${randomUUID()}.${extension}`;
  const [media] = await db.insert(media_objects).values({
    owner_id: user.id, category: categoryMap[key], file_name: path, content_type: file.type,
    file_size: file.size, data: Buffer.from(await file.arrayBuffer()), is_public: key !== "resources",
  }).returning({ id: media_objects.id });
  return NextResponse.json({ path, name: file.name, size: file.size, type: file.type, url: `/api/media/${media.id}` }, { status: 201 });
}
