import { NextResponse } from "next/server";
import { isUuid, readJson, supabaseServer } from "@/lib/server/supabase";
import { signOutAccount, signOutAll } from "@/lib/server/accounts";

/** {userId}: sign that account out of this browser. {all: true}: every account. */
export async function POST(req: Request) {
  const body = (await readJson(req, 1024)) ?? {};
  const sb = await supabaseServer();
  if (body.all === true) {
    await signOutAll(sb);
  } else {
    const id = typeof body.userId === "string" && isUuid(body.userId) ? body.userId : (await sb.auth.getUser()).data.user?.id;
    if (id) await signOutAccount(sb, id);
  }
  const { data } = await sb.auth.getUser();
  return NextResponse.json({ defaultAccount: data.user?.id ?? null });
}
