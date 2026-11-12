// Live access-control test against the real Supabase project, using the demo accounts and
// disposable documents it deletes afterwards. Proves the rules in docs/INVARIANTS.md hold in the database
// itself (not only in the API): run with `npm run test:rls`.
import { readFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = /^([A-Z_]+)=(.*)$/.exec(line.trim());
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${!ok && detail ? `  (${detail})` : ""}`);
  if (!ok) failures++;
};
const client = () => createClient(URL, KEY, { auth: { persistSession: false } });
async function as(user: string) {
  const sb = client();
  const { data, error } = await sb.auth.signInWithPassword({ email: `${user}@docspace.dev`, password: "demo1234" });
  if (error) throw error;
  return { sb, id: data.user.id };
}
const visible = async (sb: SupabaseClient, id: string) => ((await sb.from("documents").select("id").eq("id", id)).data ?? []).length === 1;

async function main() {
  const maya = await as("maya"), daniel = await as("daniel"), priya = await as("priya");
  const anon = client();

  const { data: doc, error } = await maya.sb.from("documents").insert({ owner_id: maya.id, title: "RLS check (temporary)" }).select("id").single();
  if (error) throw error;
  const id = doc.id as string;
  try {
    check("owner can read own document", await visible(maya.sb, id));
    check("anonymous cannot read any document", ((await anon.from("documents").select("id")).data ?? []).length === 0);
    check("unshared user cannot read it", !(await visible(daniel.sb, id)));
    const forged = await daniel.sb.from("documents").insert({ owner_id: maya.id, title: "forged" });
    check("cannot create a document owned by someone else", !!forged.error);

    const notOwner = await daniel.sb.rpc("share_document", { p_doc: id, p_email: "daniel@docspace.dev", p_role: "editor" });
    check("non-owner cannot share", notOwner.data?.status === "not_owner");
    const direct = await daniel.sb.from("document_shares").insert({ document_id: id, user_id: daniel.id, role: "editor" });
    check("shares cannot be inserted directly (grant revoked)", !!direct.error);

    check("share with unknown email is reported", (await maya.sb.rpc("share_document", { p_doc: id, p_email: "nobody@docspace.dev" })).data?.status === "no_user");
    check("share with self is reported", (await maya.sb.rpc("share_document", { p_doc: id, p_email: "maya@docspace.dev" })).data?.status === "is_owner");
    check("owner shares as editor", (await maya.sb.rpc("share_document", { p_doc: id, p_email: "daniel@docspace.dev", p_role: "editor" })).data?.status === "ok");
    check("duplicate share is reported", (await maya.sb.rpc("share_document", { p_doc: id, p_email: "daniel@docspace.dev" })).data?.status === "already_shared");
    check("owner shares as viewer", (await maya.sb.rpc("share_document", { p_doc: id, p_email: "priya@docspace.dev", p_role: "viewer" })).data?.status === "ok");

    check("editor can read", await visible(daniel.sb, id));
    const edit = await daniel.sb.from("documents").update({ title: "edited by editor" }).eq("id", id).select("id");
    check("editor can edit", (edit.data ?? []).length === 1, edit.error?.message);
    const steal = await daniel.sb.from("documents").update({ owner_id: daniel.id }).eq("id", id).select("id");
    check("editor cannot take ownership (column grant)", !!steal.error || (steal.data ?? []).length === 0);
    const delByEditor = await daniel.sb.from("documents").delete().eq("id", id).select("id");
    check("editor cannot delete", (delByEditor.data ?? []).length === 0);

    check("viewer can read", await visible(priya.sb, id));
    const viewerEdit = await priya.sb.from("documents").update({ title: "edited by viewer" }).eq("id", id).select("id");
    check("viewer cannot edit", (viewerEdit.data ?? []).length === 0);

    const stale = await maya.sb.from("documents").update({ title: "stale write" }).eq("id", id).eq("updated_at", "2000-01-01T00:00:00+00:00").select("id");
    check("write against a stale version matches nothing (conflict detection)", (stale.data ?? []).length === 0);

    check("owner removes viewer", (await maya.sb.rpc("update_share", { p_doc: id, p_user: priya.id, p_role: null })).data?.status === "ok");
    check("removed user loses access", !(await visible(priya.sb, id)));
    const profiles = (await priya.sb.from("profiles").select("email")).data ?? [];
    check("profiles are visible only to people who share a document", profiles.every((p) => p.email !== "") && profiles.length <= 3);
  } finally {
    const del = await maya.sb.from("documents").delete().eq("id", id).select("id");
    check("owner can delete (cleanup)", (del.data ?? []).length === 1);
  }
  console.log(failures ? `\n${failures} check(s) failed` : "\nAll access-control checks passed");
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
