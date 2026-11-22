import { MessageSquare, Trash } from "lucide-react";
import { ConfirmButton } from "@/components/ui/action-button";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardHeader } from "@/components/ui/card";
import { CommentForm } from "@/components/comment-form";
import { addComment, deleteComment, type CommentTarget } from "@/lib/actions/comments";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { comments, profiles } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { timeAgo } from "@/lib/utils";

/** Discussion thread shown on a club or event page. */
export async function Comments({ target, targetId }: { target: CommentTarget; targetId: string }) {
  const user = await getCurrentUser();
  const targetColumn = target === "club" ? comments.club_id : comments.event_id;
  const rows = await db.select({
    id: comments.id, content: comments.content, created_at: comments.created_at, author_id: comments.author_id,
    author: { full_name: profiles.full_name, avatar_url: profiles.avatar_url },
  }).from(comments).leftJoin(profiles, eq(comments.author_id, profiles.id)).where(eq(targetColumn, targetId)).orderBy(asc(comments.created_at));
  const list = rows;

  return (
    <Card>
      <CardHeader
        title="Discussion"
        description={list.length ? `${list.length} comment${list.length === 1 ? "" : "s"}` : "Start the conversation"}
      />
      <div className="p-5">
        {list.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl bg-paper px-4 py-5 text-sm text-muted">
            <MessageSquare className="size-5 shrink-0" />
            No comments yet. Ask a question or share something with others.
          </div>
        ) : (
          <ul className="space-y-5" role="list">
            {list.map((comment) => {
              const name = comment.author?.full_name || "Former student";
              const canDelete = user && (user.id === comment.author_id || user.role === "admin");
              return (
                <li key={comment.id} className="flex gap-3">
                  <Avatar name={name} src={comment.author?.avatar_url} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{name}</p>
                      <time dateTime={comment.created_at} className="text-xs text-muted">
                        {timeAgo(comment.created_at)}
                      </time>
                      {canDelete && (
                        <ConfirmButton
                          action={deleteComment.bind(null, comment.id)}
                          title="Delete comment?"
                          description="This comment will be removed for everyone."
                          size="sm"
                          aria-label="Delete comment"
                          className="ml-auto text-muted hover:text-brick-600"
                        >
                          <Trash className="size-3.5" />
                        </ConfirmButton>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm leading-relaxed whitespace-pre-line text-ink/90">{comment.content}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <CommentForm action={addComment.bind(null, target, targetId)} />
      </div>
    </Card>
  );
}
