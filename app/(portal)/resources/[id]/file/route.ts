import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { media_objects, resources } from "@/lib/db/schema";
import { idSchema } from "@/lib/validation";

export async function GET(request: NextRequest, ctx: RouteContext<"/resources/[id]/file">) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!idSchema.safeParse(id).success) return fileNotFound();
  const [resource] = await db.select({ file_path: resources.file_path, file_name: resources.file_name }).from(resources).where(eq(resources.id, id)).limit(1);
  if (!resource) return fileNotFound();
  const [file] = await db.select().from(media_objects).where(eq(media_objects.file_name, resource.file_path)).limit(1);
  if (!file || (user.role !== "admin" && user.id !== resource.file_path.split("/")[0])) return fileNotFound();
  const download = request.nextUrl.searchParams.get("download") === "1";
  const safeName = resource.file_name.replace(/[\r\n"\\]/g, "_");
  return new Response(new Uint8Array(file.data), { headers: {
    "Content-Type": file.content_type,
    "Content-Length": String(file.file_size),
    "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(resource.file_name)}`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  } });
}

function fileNotFound() {
  return Response.json({ error: "File not found" }, { status: 404 });
}
