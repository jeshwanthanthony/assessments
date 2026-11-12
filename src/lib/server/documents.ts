import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DocJSON, ShareStatus } from "@/lib/core/doc";
import type { DocFull, DocSummary, Profile } from "@/lib/core/types";

// Data access behind named functions. Every call runs as the signed-in user, so RLS decides access.

type Row = {
  id: string; title: string; owner_id: string; updated_at: string; content?: DocJSON;
  owner: Profile | null;
  document_shares: { role: "editor" | "viewer"; created_at: string; user: Profile | null }[];
};

const SELECT = "id,title,owner_id,updated_at,owner:profiles!documents_owner_id_fkey(id,email,name,color),document_shares(role,created_at,user:profiles(id,email,name,color))";

function toSummary(r: Row, me: string): DocSummary {
  const shares = [...(r.document_shares ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const mine = shares.find((s) => s.user?.id === me);
  return {
    id: r.id, title: r.title, ownerId: r.owner_id, updatedAt: r.updated_at, owner: r.owner,
    role: r.owner_id === me ? "owner" : mine?.role ?? "viewer",
    sharedWith: shares.filter((s) => s.user).map((s) => ({ user: s.user!, role: s.role })),
  };
}

export async function listDocuments(sb: SupabaseClient, me: string, scope: "owned" | "shared") {
  let q = sb.from("documents").select(SELECT).order("updated_at", { ascending: false }).limit(500);
  q = scope === "owned" ? q.eq("owner_id", me) : q.neq("owner_id", me);
  const { data, error } = await q;
  if (error) throw error;
  return (data as unknown as Row[]).map((r) => toSummary(r, me));
}

export async function getDocument(sb: SupabaseClient, me: string, id: string): Promise<DocFull | null> {
  const { data, error } = await sb.from("documents").select(`${SELECT},content`).eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const r = data as unknown as Row;
  return { ...toSummary(r, me), content: r.content! };
}

export async function createDocument(sb: SupabaseClient, me: string, title: string, content?: DocJSON) {
  const { data, error } = await sb.from("documents")
    .insert({ owner_id: me, title, ...(content ? { content } : {}) })
    .select("id").single();
  if (error) throw error;
  return data.id as string;
}

/**
 * Returns the new updated_at, or null when no row matched: RLS hid it (no access, or a viewer),
 * or `base` is set and someone else saved since (optimistic concurrency, so an edit is never silently overwritten).
 */
export async function updateDocument(sb: SupabaseClient, id: string, patch: { title?: string; content?: DocJSON }, base?: string) {
  let q = sb.from("documents").update(patch).eq("id", id);
  if (base) q = q.eq("updated_at", base);
  const { data, error } = await q.select("id,updated_at");
  if (error) throw error;
  return data.length ? (data[0].updated_at as string) : null;
}

export async function deleteDocument(sb: SupabaseClient, id: string) {
  const { data, error } = await sb.from("documents").delete().eq("id", id).select("id");
  if (error) throw error;
  return data.length > 0;
}

export async function shareDocument(sb: SupabaseClient, id: string, email: string, role: "editor" | "viewer") {
  const { data, error } = await sb.rpc("share_document", { p_doc: id, p_email: email, p_role: role });
  if (error) throw error;
  return data as { status: ShareStatus; user?: Profile };
}

export async function updateShare(sb: SupabaseClient, id: string, userId: string, role: "editor" | "viewer" | null) {
  const { data, error } = await sb.rpc("update_share", { p_doc: id, p_user: userId, p_role: role });
  if (error) throw error;
  return (data as { status: string }).status;
}

export async function getProfile(sb: SupabaseClient, me: string) {
  const { data } = await sb.from("profiles").select("id,email,name,color").eq("id", me).maybeSingle();
  return data as Profile | null;
}
