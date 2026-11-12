import { NextResponse } from "next/server";
import { fail, readJson, supabaseServer } from "@/lib/server/supabase";
import { isValidEmail } from "@/lib/core/doc";
import { forget, stashDefault } from "@/lib/server/accounts";

export async function POST(req: Request) {
  const body = await readJson(req, 4096);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!isValidEmail(email) || !password || password.length > 200) {
    return fail(400, "invalid_input", "Enter your email and password.");
  }
  const sb = await supabaseServer();
  // Keep the account that is signed in now: it moves to the account switcher.
  const prev = await stashDefault(sb, email);
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    if (prev) await forget(prev); // still the default account: not a stored entry

    // One message for unknown email and wrong password: no account enumeration.
    const limited = error?.status === 429;
    return fail(
      limited ? 429 : 401,
      limited ? "rate_limited" : "invalid_credentials",
      limited ? "Too many attempts. Wait a minute and try again." : "That email and password don't match. Try again.",
    );
  }
  await forget(data.user.id);
  return NextResponse.json({ user: { id: data.user.id, email: data.user.email } });
}
