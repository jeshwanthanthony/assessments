import "server-only";
import { cookies } from "next/headers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Several accounts signed in on one browser, and a different one per tab.
//
// - The DEFAULT account is the normal Supabase session cookie (new tabs use it; page routing checks it).
// - Every OTHER signed-in account is kept server-side in httpOnly cookies that page scripts cannot read:
//   `ds_accounts` = [{ id, email, name, color, rt }] (rt = that account's refresh token) and one
//   `ds_at_<id8>` access-token cookie per account, refreshed from rt when it expires.
// - Each tab sends `x-docspace-user` (the account it is using); requireUser serves the request as that
//   account if, and only if, it is signed in on this browser. RLS then applies to that account.

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const JAR = "ds_accounts";
const MAX_ACCOUNTS = 5;
const secure = process.env.NODE_ENV === "production";

export type StoredAccount = { id: string; email: string; name: string; color: string; rt: string };
export type PublicAccount = Omit<StoredAccount, "rt">;

const atCookie = (id: string) => `ds_at_${id.replace(/-/g, "").slice(0, 12)}`;
const isEntry = (v: unknown): v is StoredAccount => {
  const e = v as StoredAccount;
  return !!e && [e.id, e.email, e.name, e.color, e.rt].every((x) => typeof x === "string" && x.length > 0 && x.length < 2048);
};
export const toPublic = ({ rt: _rt, ...a }: StoredAccount): PublicAccount => a;

export async function readJar(): Promise<StoredAccount[]> {
  const raw = (await cookies()).get(JAR)?.value;
  if (!raw) return [];
  try {
    const list = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    return Array.isArray(list) ? list.filter(isEntry).slice(0, MAX_ACCOUNTS) : [];
  } catch {
    return [];
  }
}

async function writeJar(list: StoredAccount[]) {
  const store = await cookies();
  if (!list.length) return void store.delete(JAR);
  store.set(JAR, Buffer.from(JSON.stringify(list.slice(0, MAX_ACCOUNTS))).toString("base64url"), {
    httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
}

async function setAccessToken(id: string, token: string, expiresIn: number) {
  (await cookies()).set(atCookie(id), token, {
    httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: Math.max(60, expiresIn - 60),
  });
}

async function upsert(entry: StoredAccount) {
  const list = (await readJar()).filter((a) => a.id !== entry.id);
  await writeJar([entry, ...list]);
}

export async function forget(id: string) {
  await writeJar((await readJar()).filter((a) => a.id !== id));
  (await cookies()).delete(atCookie(id));
}

/** Copies the default (cookie) account into the server-side list, so signing into another account keeps it. */
export async function stashDefault(sb: SupabaseClient, except?: string): Promise<string | null> {
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return null;
  if (except && u.user.email?.toLowerCase() === except.toLowerCase()) return u.user.id;
  const { data: s } = await sb.auth.getSession();
  if (!s.session?.refresh_token) return null;
  const { data: p } = await sb.from("profiles").select("name,color").eq("id", u.user.id).maybeSingle();
  await upsert({
    id: u.user.id, email: u.user.email ?? "", name: p?.name ?? u.user.email ?? "Account", color: p?.color ?? "#5f5f66",
    rt: s.session.refresh_token,
  });
  if (s.session.access_token && s.session.expires_at) {
    await setAccessToken(u.user.id, s.session.access_token, s.session.expires_at - Math.floor(Date.now() / 1000));
  }
  return u.user.id;
}

/** A Supabase client acting as a stored (non-default) account, refreshing its token when needed. */
export async function clientFor(id: string): Promise<{ sb: SupabaseClient; user: { id: string; email: string } } | null> {
  const entry = (await readJar()).find((a) => a.id === id);
  if (!entry) return null;
  let at = (await cookies()).get(atCookie(id))?.value;
  if (!at) {
    const tmp = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await tmp.auth.refreshSession({ refresh_token: entry.rt });
    if (error || !data.session || data.user?.id !== id) {
      await forget(id);
      return null;
    }
    at = data.session.access_token;
    await upsert({ ...entry, rt: data.session.refresh_token });
    await setAccessToken(id, at, data.session.expires_in);
  }
  const sb = createClient(URL, KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${at}` } },
  });
  // Local signature check (ES256, cached keys) instead of a round trip to Supabase Auth.
  const { data } = await sb.auth.getClaims(at);
  if (data?.claims?.sub !== id) {
    (await cookies()).delete(atCookie(id)); // expired: the next request refreshes it
    return null;
  }
  return { sb, user: { id, email: typeof data.claims.email === "string" ? data.claims.email : entry.email } };
}

/** Makes a stored account the default (cookie) account. False (and forgotten) if its session expired. */
export async function promote(sb: SupabaseClient, id: string): Promise<boolean> {
  const entry = (await readJar()).find((a) => a.id === id);
  if (!entry) return false;
  const { data, error } = await sb.auth.refreshSession({ refresh_token: entry.rt });
  await forget(id);
  return !error && data.user?.id === id;
}

/** After the default account signs out or is deleted, the next stored account becomes the default. */
export async function promoteNext(sb: SupabaseClient): Promise<PublicAccount | null> {
  for (const a of await readJar()) if (await promote(sb, a.id)) return toPublic(a);
  return null;
}

/** Signs one account out of this browser: revokes its session and forgets it. */
export async function signOutAccount(sb: SupabaseClient, id: string): Promise<void> {
  // Local token check: also matches an account that was just deleted (Supabase Auth no longer knows it).
  const { data: c } = await sb.auth.getClaims();
  if (c?.claims?.sub === id) {
    await sb.auth.signOut({ scope: "local" }).catch(() => {});
    await promoteNext(sb);
    return;
  }
  const at = (await cookies()).get(atCookie(id))?.value;
  if (at) {
    await fetch(`${URL}/auth/v1/logout?scope=local`, { method: "POST", headers: { apikey: KEY, Authorization: `Bearer ${at}` } }).catch(() => {});
  }
  await forget(id);
}

export async function signOutAll(sb: SupabaseClient): Promise<void> {
  for (const a of await readJar()) await signOutAccount(sb, a.id);
  await sb.auth.signOut({ scope: "local" }).catch(() => {});
  await writeJar([]);
}
