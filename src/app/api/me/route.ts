import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/supabase";
import { getProfile } from "@/lib/server/documents";

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ user: await getProfile(auth.sb, auth.user.id) });
}
