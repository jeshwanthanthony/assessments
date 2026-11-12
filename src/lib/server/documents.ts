import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { DocJSON, ShareStatus } from "@/lib/core/doc";
import type { Comment, DocFull, DocSummary, Profile, ShareRole, Version } from "@/lib/core/types";

// Data access behind named functions. Every call runs as the signed-in user, so RLS decides access.

type Row = {
  id: string; title: string; owner_id: string; updated_at: string; content?: DocJSON;
  owner: Profile | null;
  document_shares: { role: ShareRole; created_at: string; user: Profile | null }[];
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

export async function shareDocument(sb: SupabaseClient, id: string, email: string, role: ShareRole) {
  const { data, error } = await sb.rpc("share_document", { p_doc: id, p_email: email, p_role: role });
  if (error) throw error;
  return data as { status: ShareStatus; user?: Profile };
}

export async function updateShare(sb: SupabaseClient, id: string, userId: string, role: ShareRole | null) {
  const { data, error } = await sb.rpc("update_share", { p_doc: id, p_user: userId, p_role: role });
  if (error) throw error;
  return (data as { status: string }).status;
}

export async function getProfile(sb: SupabaseClient, me: string) {
  const { data } = await sb.from("profiles").select("id,email,name,color").eq("id", me).maybeSingle();
  return data as Profile | null;
}

// ---------- comments ----------

type CommentRow = {
  id: string; document_id: string; parent_id: string | null; quote: string | null; body: string;
  resolved: boolean; created_at: string; author: Profile | null;
};
const toComment = (r: CommentRow): Comment => ({
  id: r.id, documentId: r.document_id, parentId: r.parent_id, quote: r.quote, body: r.body,
  resolved: r.resolved, createdAt: r.created_at, author: r.author,
});
const COMMENT_SELECT = "id,document_id,parent_id,quote,body,resolved,created_at,author:profiles(id,email,name,color)";

export async function listComments(sb: SupabaseClient, docId: string) {
  const { data, error } = await sb.from("document_comments").select(COMMENT_SELECT).eq("document_id", docId).order("created_at").limit(1000);
  if (error) throw error;
  return (data as unknown as CommentRow[]).map(toComment);
}

/** Returns null when RLS refused (a viewer, or no access). */
export async function addComment(sb: SupabaseClient, me: string, docId: string, c: { body: string; quote: string | null; parentId: string | null }) {
  const { data, error } = await sb.from("document_comments")
    .insert({ document_id: docId, author_id: me, body: c.body, quote: c.quote, parent_id: c.parentId })
    .select(COMMENT_SELECT).maybeSingle();
  if (error) {
    if (error.code === "42501") return null;
    throw error;
  }
  return data ? toComment(data as unknown as CommentRow) : null;
}

export async function setCommentResolved(sb: SupabaseClient, docId: string, id: string, resolved: boolean) {
  const { data, error } = await sb.from("document_comments").update({ resolved }).eq("id", id).eq("document_id", docId).select("id");
  if (error) throw error;
  return data.length > 0;
}

export async function deleteComment(sb: SupabaseClient, docId: string, id: string) {
  const { data, error } = await sb.from("document_comments").delete().eq("id", id).eq("document_id", docId).select("id");
  if (error) throw error;
  return data.length > 0;
}

// ---------- versions ----------

export async function listVersions(sb: SupabaseClient, docId: string): Promise<Version[]> {
  const { data, error } = await sb.from("document_versions")
    .select("id,title,created_at,updated_at,saved_by:profiles(id,email,name,color)")
    .eq("document_id", docId).order("updated_at", { ascending: false }).limit(50);
  if (error) throw error;
  return (data as unknown as { id: string; title: string; created_at: string; updated_at: string; saved_by: Profile | null }[])
    .map((v) => ({ id: v.id, title: v.title, createdAt: v.created_at, updatedAt: v.updated_at, savedBy: v.saved_by }));
}

export async function getVersion(sb: SupabaseClient, docId: string, id: string) {
  const { data, error } = await sb.from("document_versions").select("id,title,content,updated_at").eq("document_id", docId).eq("id", id).maybeSingle();
  if (error) throw error;
  return data as { id: string; title: string; content: DocJSON; updated_at: string } | null;
}

// ---------- accounts ----------

export async function signUp(sb: SupabaseClient, email: string, password: string, name: string) {
  const { data, error } = await sb.rpc("sign_up", { p_email: email, p_password: password, p_name: name });
  if (error) throw error;
  return (data as { status: import("@/lib/core/auth").SignUpStatus }).status;
}
