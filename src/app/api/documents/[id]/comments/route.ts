import { NextResponse } from "next/server";
import { fail, isUuid, readJson, requireUser } from "@/lib/server/supabase";
import { addComment, listComments } from "@/lib/server/documents";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isUuid(id)) return fail(404, "not_found", "Not found.");
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  try {
    return NextResponse.json({ comments: await listComments(auth.sb, id) });
  } catch {
    return fail(500, "load_failed", "Couldn't load comments.");
  }
}

/** {body, quote?, parentId?}. RLS allows owner, editors and commenters; viewers get 403. */
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const b = await readJson(req, 8192);
  const body = typeof b?.body === "string" ? b.body.trim() : "";
  const quote = typeof b?.quote === "string" && b.quote.trim() ? b.quote.trim().slice(0, 500) : null;
  const parentId = typeof b?.parentId === "string" && isUuid(b.parentId) ? b.parentId : null;
  if (!isUuid(id)) return fail(404, "not_found", "Not found.");
  if (!body) return fail(400, "empty_comment", "Write a comment first.");
  if (body.length > 2000) return fail(400, "too_long", "Comments can be up to 2,000 characters.");
  try {
    const c = await addComment(auth.sb, auth.user.id, id, { body, quote, parentId });
    return c ? NextResponse.json({ comment: c }, { status: 201 }) : fail(403, "cannot_comment", "You can view this document but not comment on it.");
  } catch {
    return fail(500, "comment_failed", "Couldn't post your comment. Try again.");
  }
}
