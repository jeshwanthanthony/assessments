import { NextResponse } from "next/server";
import { fail, isUuid, readJson, requireUser } from "@/lib/server/supabase";
import { deleteComment, setCommentResolved } from "@/lib/server/documents";

type Ctx = { params: Promise<{ id: string; commentId: string }> };

/** {resolved: boolean}. Anyone who can comment can resolve or reopen a thread. */
export async function PATCH(req: Request, { params }: Ctx) {
  const { id, commentId } = await params;
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const b = await readJson(req, 1024);
  if (!isUuid(id) || !isUuid(commentId) || typeof b?.resolved !== "boolean") return fail(400, "invalid_input", "Invalid request.");
  try {
    return (await setCommentResolved(auth.sb, id, commentId, b.resolved))
      ? NextResponse.json({ ok: true })
      : fail(403, "forbidden", "You can't change this comment.");
  } catch {
    return fail(500, "update_failed", "Couldn't update the comment.");
  }
}

/** The author, or the document owner, can delete a comment (replies go with it). */
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id, commentId } = await params;
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  if (!isUuid(id) || !isUuid(commentId)) return fail(400, "invalid_input", "Invalid request.");
  try {
    return (await deleteComment(auth.sb, id, commentId))
      ? NextResponse.json({ ok: true })
      : fail(403, "forbidden", "Only the author or the owner can delete this comment.");
  } catch {
    return fail(500, "delete_failed", "Couldn't delete the comment.");
  }
}
