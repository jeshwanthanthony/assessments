import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { clientFor } from "./accounts";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** A Supabase client acting AS the signed-in user: every query runs under RLS. */
export async function supabaseServer(): Promise<SupabaseClient> {
  if (!URL || !KEY) throw new Error("Supabase env vars are missing (see .env.example)");
  const store = await cookies();
  return createServerClient(URL, KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component: the proxy refreshes cookies instead.
        }
      },
    },
  });
}

export type ApiError = { error: { code: string; message: string } };

export function fail(http: number, code: string, message: string) {
  return NextResponse.json<ApiError>({ error: { code, message } }, { status: http });
}

/** Resolves the verified user (server-checked with Supabase Auth, never trusted from the client) or returns 401. */
export const EXPECTED_USER_HEADER = "x-docspace-user";

export type AuthUser = { id: string; email: string };

/**
 * Verifies the session token's signature (ES256) locally against the project's cached public keys:
 * about 1 ms instead of a network round trip to Supabase Auth on every request.
 */
export async function verifiedUser(sb: SupabaseClient, jwt?: string): Promise<AuthUser | null> {
  const { data, error } = await sb.auth.getClaims(jwt);
  const c = data?.claims;
  if (error || !c?.sub) return null;
  return { id: c.sub, email: typeof c.email === "string" ? c.email : "" };
}

/**
 * Resolves the verified user, or returns 401. If the page says which user it believes it is
 * (x-docspace-user) and the session cookie now belongs to someone else (another tab switched
 * account), refuse with 409 so a stale tab can never act as the wrong person.
 */
export async function requireUser(): Promise<{ sb: SupabaseClient; user: AuthUser } | NextResponse> {
  const sb = await supabaseServer();
  const user = await verifiedUser(sb);
  const data = { user };
  const expected = (await headers()).get(EXPECTED_USER_HEADER);
  if (expected && expected !== data.user?.id) {
    // This tab uses another account signed in on this browser: act as it, or refuse if it is not signed in here.
    const other = isUuid(expected) ? await clientFor(expected) : null;
    if (other) return other;
    return fail(409, "session_changed", "That account was signed out on this browser.");
  }
  if (!data.user) return fail(401, "unauthenticated", "Sign in to continue.");
  return { sb, user: data.user };
}

export const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export async function readJson(req: Request, maxBytes = 1_100_000): Promise<Record<string, unknown> | null> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > maxBytes) return null;
  try {
    const text = await req.text();
    if (text.length > maxBytes) return null;
    const v = JSON.parse(text);
    return v && typeof v === "object" && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}
