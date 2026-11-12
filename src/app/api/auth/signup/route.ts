import { NextResponse } from "next/server";
import { fail, readJson, supabaseServer } from "@/lib/server/supabase";
import { signUp } from "@/lib/server/documents";
import { isStrongPassword, normalizeName, signUpOutcome } from "@/lib/core/auth";
import { isValidEmail } from "@/lib/core/doc";

/** Creates an account (policy checked here AND in the database), then signs the new user in. */
export async function POST(req: Request) {
  const body = await readJson(req, 4096);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = normalizeName(body?.name);
  if (!name) return fail(400, "invalid_name", "Enter your name.");
  if (!isValidEmail(email)) return fail(400, "invalid_email", "Enter a valid email address.");
  if (!isStrongPassword(password)) return fail(400, "weak_password", signUpOutcome("weak_password").message);

  const sb = await supabaseServer();
  try {
    const status = await signUp(sb, email, password, name);
    if (status !== "ok") {
      const out = signUpOutcome(status);
      return fail(out.http, status, out.message);
    }
  } catch {
    return fail(500, "signup_failed", "Couldn't create your account. Try again.");
  }
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return fail(500, "signin_failed", "Account created. Sign in to continue.");
  return NextResponse.json({ ok: true }, { status: 201 });
}
