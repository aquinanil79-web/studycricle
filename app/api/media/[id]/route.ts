import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { media_objects } from "@/lib/db/schema";
import { idSchema } from "@/lib/validation";

export async function GET(_request: NextRequest, context: RouteContext<"/api/media/[id]">) {
  const { id } = await context.params;
  if (!idSchema.safeParse(id).success) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [file] = await db.select().from(media_objects).where(eq(media_objects.id, id)).limit(1);
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!file.is_public) {
    const user = await getCurrentUser();
    if (!user || (user.id !== file.owner_id && user.role !== "admin")) return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new Response(new Uint8Array(file.data), { headers: { "Content-Type": file.content_type, "Content-Length": String(file.file_size), "Cache-Control": file.is_public ? "public, max-age=3600" : "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
