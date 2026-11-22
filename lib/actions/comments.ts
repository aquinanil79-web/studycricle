"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { comments } from "@/lib/db/schema";
import type { ActionState } from "@/lib/types";
import { commentSchema, idSchema, parseForm } from "@/lib/validation";
import { failed, succeeded } from "./result";

export type CommentTarget = "club" | "event";
const pagePath = (target: CommentTarget, targetId: string) => target === "club" ? `/clubs/${targetId}` : `/events/${targetId}`;

export async function addComment(target: CommentTarget, targetId: string, _state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if ((target !== "club" && target !== "event") || !idSchema.safeParse(targetId).success) return { ok: false, message: "Invalid discussion." };
  const { data, error } = parseForm(commentSchema, formData);
  if (error) return error;
  try {
    await db.insert(comments).values({ content: data.content, author_id: user.id, club_id: target === "club" ? targetId : null, event_id: target === "event" ? targetId : null });
  } catch (cause) { return failed({ message: String(cause) }, "Could not post your comment."); }
  revalidatePath(pagePath(target, targetId));
  return succeeded("Comment posted.");
}

export async function deleteComment(commentId: string): Promise<ActionState> {
  const user = await requireUser();
  if (!idSchema.safeParse(commentId).success) return { ok: false, message: "Invalid comment." };
  const [comment] = await db.select({ club_id: comments.club_id, event_id: comments.event_id, author_id: comments.author_id }).from(comments).where(eq(comments.id, commentId)).limit(1);
  if (!comment || (comment.author_id !== user.id && user.role !== "admin")) return { ok: false, message: "You can only delete your own comments." };
  const result = await db.delete(comments).where(and(eq(comments.id, commentId), user.role === "admin" ? undefined : eq(comments.author_id, user.id))).returning();
  if (!result.length) return { ok: false, message: "You can only delete your own comments." };
  if (comment.club_id) revalidatePath(pagePath("club", comment.club_id));
  if (comment.event_id) revalidatePath(pagePath("event", comment.event_id));
  return succeeded("Comment deleted.");
}
