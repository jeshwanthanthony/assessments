import { NextResponse } from "next/server";
import { fail, readJson, requireUser } from "@/lib/server/supabase";
import { createDocument, listDocuments } from "@/lib/server/documents";
import { normalizeTitle } from "@/lib/core/doc";

export async function GET(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const scope = new URL(req.url).searchParams.get("scope") === "shared" ? "shared" : "owned";
  try {
    return NextResponse.json({ documents: await listDocuments(auth.sb, auth.user.id, scope) });
  } catch {
    return fail(500, "load_failed", "Couldn't load your documents.");
  }
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const body = (await readJson(req, 4096)) ?? {};
  try {
    const id = await createDocument(auth.sb, auth.user.id, normalizeTitle(body.title));
    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return fail(500, "create_failed", "Couldn't create the document. Try again.");
  }
}
