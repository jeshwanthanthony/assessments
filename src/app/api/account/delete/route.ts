import { NextResponse } from "next/server";
import { fail, readJson, requireUser } from "@/lib/server/supabase";
import { forget, signOutAccount } from "@/lib/server/accounts";
import { supabaseServer } from "@/lib/server/supabase";

const OUTCOME: Record<string, [number, string]> = {
  wrong_password: [403, "That password isn't right."],
  demo_account: [403, "Sample accounts are shared by reviewers and can't be deleted."],
  not_signed_in: [401, "Sign in to continue."],
};

/** Deletes the signed-in account and everything it owns, after re-checking the password. */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const body = await readJson(req, 1024);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password) return fail(400, "password_required", "Enter your password to confirm.");
  try {
    const { data, error } = await auth.sb.rpc("delete_my_account", { p_password: password });
    if (error) throw error;
    const status = (data as { status: string }).status;
    if (status !== "ok") {
      const [http, message] = OUTCOME[status] ?? [400, "Couldn't delete the account."];
      return fail(http, status, message);
    }
  } catch {
    return fail(500, "delete_failed", "Couldn't delete the account. Try again.");
  }
  // The account no longer exists: drop it from this browser (and hand the default to the next account).
  const cookieClient = await supabaseServer();
  await signOutAccount(cookieClient, auth.user.id).catch(() => {});
  await forget(auth.user.id);
  return NextResponse.json({ ok: true });
}
