import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/server/supabase";

export async function POST() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  return NextResponse.json({ ok: true });
}
