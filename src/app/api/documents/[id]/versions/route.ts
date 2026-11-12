import { NextResponse } from "next/server";
import { fail, isUuid, requireUser } from "@/lib/server/supabase";
import { listVersions } from "@/lib/server/documents";

type Ctx = { params: Promise<{ id: string }> };

/** Snapshots are written by a database trigger on save (one per person per 10-minute session, 50 kept). */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isUuid(id)) return fail(404, "not_found", "Not found.");
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  try {
    return NextResponse.json({ versions: await listVersions(auth.sb, id) });
  } catch {
    return fail(500, "load_failed", "Couldn't load version history.");
  }
}
