import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/server/supabase";
import { readJar, toPublic } from "@/lib/server/accounts";

/** Every account signed in on this browser (the default one first). Never returns tokens. */
export async function GET() {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  const list = [];
  if (data.user) {
    const { data: p } = await sb.from("profiles").select("id,email,name,color").eq("id", data.user.id).maybeSingle();
    if (p) list.push(p);
  }
  for (const a of await readJar()) if (a.id !== data.user?.id) list.push(toPublic(a));
  return NextResponse.json({ accounts: list, defaultAccount: data.user?.id ?? null });
}
