import { NextResponse } from "next/server";
import { fail, isUuid, readJson, requireUser } from "@/lib/server/supabase";
import { shareDocument, updateShare } from "@/lib/server/documents";
import { isValidEmail, shareOutcome } from "@/lib/core/doc";
import type { ShareRole } from "@/lib/core/types";

type Ctx = { params: Promise<{ id: string }> };
const parseRole = (v: unknown): ShareRole | null =>
  v === "viewer" || v === "commenter" ? v : v === "editor" || v === undefined ? "editor" : null;

/** Owner grants access by email. The database function re-checks ownership. */
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const body = await readJson(req, 4096);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = parseRole(body?.role);
  if (!isUuid(id) || !role) return fail(400, "invalid_input", "Invalid request.");
  if (!isValidEmail(email)) return fail(400, "invalid_email", "Enter a valid email address.");
  try {
    const res = await shareDocument(auth.sb, id, email, role);
    const out = shareOutcome(res.status, email, res.user?.name, role);
    return res.status === "ok"
      ? NextResponse.json({ user: res.user, role, message: out.message })
      : fail(out.http, res.status, out.message);
  } catch {
    return fail(500, "share_failed", "Couldn't share this document. Try again.");
  }
}

/** Owner changes a person's role ({userId, role}) or removes them ({userId, role: null}). */
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const body = await readJson(req, 4096);
  const userId = typeof body?.userId === "string" ? body.userId : "";
  const remove = body?.role === null;
  const role = remove ? null : parseRole(body?.role);
  if (!isUuid(id) || !isUuid(userId) || (!remove && !role)) return fail(400, "invalid_input", "Invalid request.");
  try {
    const status = await updateShare(auth.sb, id, userId, role);
    return status === "ok" ? NextResponse.json({ ok: true }) : fail(403, status, "Only the owner can change access.");
  } catch {
    return fail(500, "share_failed", "Couldn't update access. Try again.");
  }
}
