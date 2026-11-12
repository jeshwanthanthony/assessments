import { NextResponse } from "next/server";
import { fail, isUuid, readJson, requireUser } from "@/lib/server/supabase";
import { deleteDocument, getDocument, updateDocument } from "@/lib/server/documents";
import { isDocJSON, LIMITS, normalizeTitle, type DocJSON } from "@/lib/core/doc";

type Ctx = { params: Promise<{ id: string }> };
const notFound = () =>
  fail(404, "not_found", "This document isn't available. It may have been deleted, or you don't have access.");

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isUuid(id)) return notFound();
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  try {
    const doc = await getDocument(auth.sb, auth.user.id, id);
    return doc ? NextResponse.json({ document: doc }) : notFound();
  } catch {
    return fail(500, "load_failed", "Couldn't open this document.");
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isUuid(id)) return notFound();
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const body = await readJson(req, LIMITS.contentBytes + 10_000);
  if (!body) return fail(413, "too_large", "This document is too large to save.");
  const patch: { title?: string; content?: DocJSON } = {};
  if ("title" in body) patch.title = normalizeTitle(body.title);
  if ("content" in body) {
    if (!isDocJSON(body.content)) return fail(400, "invalid_content", "The document content is not valid.");
    patch.content = body.content;
  }
  if (!Object.keys(patch).length) return fail(400, "empty_patch", "Nothing to save.");
  // baseUpdatedAt: the version the client edited. Omitted (or force) means "overwrite".
  const base = typeof body.baseUpdatedAt === "string" && body.force !== true ? body.baseUpdatedAt : undefined;
  try {
    const updatedAt = await updateDocument(auth.sb, id, patch, base);
    if (!updatedAt) {
      // No row matched: a viewer, no access, or a newer version saved by someone else.
      const doc = await getDocument(auth.sb, auth.user.id, id);
      if (!doc) return notFound();
      if (doc.role === "viewer") return fail(403, "read_only", "You can view this document but not edit it.");
      return NextResponse.json(
        { error: { code: "conflict", message: "Someone else saved a newer version." }, latest: doc },
        { status: 409 },
      );
    }
    return NextResponse.json({ updatedAt, title: patch.title });
  } catch {
    return fail(500, "save_failed", "Couldn't save.");
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isUuid(id)) return notFound();
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  try {
    return (await deleteDocument(auth.sb, id))
      ? NextResponse.json({ ok: true })
      : fail(403, "not_owner", "Only the owner can delete this document.");
  } catch {
    return fail(500, "delete_failed", "Couldn't delete this document.");
  }
}
