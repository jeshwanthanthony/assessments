import { NextResponse } from "next/server";
import { fail, isUuid, requireUser } from "@/lib/server/supabase";
import { getDocument, getVersion, updateDocument } from "@/lib/server/documents";
import { canEdit } from "@/lib/core/types";

type Ctx = { params: Promise<{ id: string; versionId: string }> };
const notFound = () => fail(404, "not_found", "This version isn't available.");

export async function GET(_req: Request, { params }: Ctx) {
  const { id, versionId } = await params;
  if (!isUuid(id) || !isUuid(versionId)) return notFound();
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  try {
    const v = await getVersion(auth.sb, id, versionId);
    return v ? NextResponse.json({ version: v }) : notFound();
  } catch {
    return fail(500, "load_failed", "Couldn't load this version.");
  }
}

/** Restore: the version's title and content become the current document (itself saved as a new version). */
export async function POST(_req: Request, { params }: Ctx) {
  const { id, versionId } = await params;
  if (!isUuid(id) || !isUuid(versionId)) return notFound();
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  try {
    const doc = await getDocument(auth.sb, auth.user.id, id);
    if (!doc) return notFound();
    if (!canEdit(doc.role)) return fail(403, "read_only", "Only the owner and editors can restore a version.");
    const v = await getVersion(auth.sb, id, versionId);
    if (!v) return notFound();
    const updatedAt = await updateDocument(auth.sb, id, { title: v.title, content: v.content });
    if (!updatedAt) return fail(403, "read_only", "Only the owner and editors can restore a version.");
    return NextResponse.json({ updatedAt, title: v.title, content: v.content });
  } catch {
    return fail(500, "restore_failed", "Couldn't restore this version.");
  }
}
