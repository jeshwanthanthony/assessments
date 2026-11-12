import { NextResponse } from "next/server";
import { fail, isUuid, readJson, supabaseServer } from "@/lib/server/supabase";
import { promote, readJar, stashDefault } from "@/lib/server/accounts";

/** Makes another signed-in account the default for new tabs (used by the sign-in page). Tabs switch on their own. */
export async function POST(req: Request) {
  const body = await readJson(req, 1024);
  const userId = typeof body?.userId === "string" ? body.userId : "";
  if (!isUuid(userId)) return fail(400, "invalid_input", "Invalid request.");
  if (!(await readJar()).some((a) => a.id === userId)) return fail(404, "not_signed_in", "That account isn't signed in on this browser.");
  const sb = await supabaseServer();
  await stashDefault(sb);
  if (!(await promote(sb, userId))) return fail(401, "session_expired", "That account's session has expired. Sign in to it again.");
  return NextResponse.json({ ok: true });
}
