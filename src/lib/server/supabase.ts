import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

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
export async function requireUser(): Promise<{ sb: SupabaseClient; user: User } | NextResponse> {
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.getUser();
  if (error || !data.user) return fail(401, "unauthenticated", "Sign in to continue.");
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
