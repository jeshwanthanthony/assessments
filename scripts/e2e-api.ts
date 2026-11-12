// End-to-end API test of the five core tasks over real HTTP, as two demo users with cookies.
// Creates and deletes its own documents. Usage: BASE=http://localhost:3000 npm run test:e2e
const BASE = process.env.BASE ?? "http://localhost:3000";
let failures = 0;
const check = (name: string, ok: boolean, detail?: unknown) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${!ok && detail !== undefined ? `  (${JSON.stringify(detail)})` : ""}`);
  if (!ok) failures++;
};

class Session {
  cookies = new Map<string, string>();
  async req(path: string, init: RequestInit & { json?: unknown } = {}) {
    const { json, ...rest } = init;
    const headers = new Headers(rest.headers);
    if (json !== undefined) headers.set("content-type", "application/json");
    if (this.cookies.size) headers.set("cookie", [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "));
    const res = await fetch(BASE + path, { ...rest, headers, body: json !== undefined ? JSON.stringify(json) : rest.body, redirect: "manual" });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      const k = pair.slice(0, i), v = pair.slice(i + 1);
      if (v) this.cookies.set(k, v); else this.cookies.delete(k);
    }
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  }
}

const doc = (...paras: string[]) => ({ type: "doc", content: paras.map((t) => ({ type: "paragraph", content: [{ type: "text", text: t }] })) });

async function main() {
  const anon = new Session();
  check("unauthenticated API call is 401 JSON", (await anon.req("/api/documents")).status === 401);
  check("unauthenticated page redirects to /login", (await fetch(BASE + "/", { redirect: "manual" })).status === 307);
  const bad = await anon.req("/api/auth/login", { method: "POST", json: { email: "maya@docspace.dev", password: "wrong" } });
  check("wrong password is 401 with the spec copy", bad.status === 401 && /don't match/.test(bad.body?.error?.message), bad.body);
  check("malformed login body is 400", (await anon.req("/api/auth/login", { method: "POST", body: "{not json", headers: { "content-type": "application/json" } })).status === 400);

  const maya = new Session(), daniel = new Session();
  check("Maya signs in", (await maya.req("/api/auth/login", { method: "POST", json: { email: "maya@docspace.dev", password: "demo1234" } })).status === 200);
  check("Daniel signs in", (await daniel.req("/api/auth/login", { method: "POST", json: { email: "daniel@docspace.dev", password: "demo1234" } })).status === 200);
  const created: string[] = [];
  try {
    // 1. create, rename, edit, save, reopen
    const c = await maya.req("/api/documents", { method: "POST", json: {} });
    const id = c.body?.id as string;
    created.push(id);
    check("1 create a document", c.status === 201 && !!id, c.body);
    const g0 = await maya.req(`/api/documents/${id}`);
    check("1 new document is titled 'Untitled document'", g0.body?.document?.title === "Untitled document");
    const rn = await maya.req(`/api/documents/${id}`, { method: "PATCH", json: { title: "  E2E   plan  " } });
    check("1 rename (title normalized)", rn.status === 200 && rn.body?.title === "E2E plan", rn.body);
    const rich = { type: "doc", content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Goals" }] },
      { type: "paragraph", content: [{ type: "text", text: "bold", marks: [{ type: "bold" }] }, { type: "text", text: " and " }, { type: "text", text: "under", marks: [{ type: "underline" }, { type: "italic" }] }] },
      { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "one" }] }] }] },
    ] };
    const base1 = (await maya.req(`/api/documents/${id}`)).body.document.updatedAt;
    const s1 = await maya.req(`/api/documents/${id}`, { method: "PATCH", json: { content: rich, baseUpdatedAt: base1 } });
    check("1 save rich content", s1.status === 200, s1.body);
    const g1 = await maya.req(`/api/documents/${id}`);
    // jsonb stores keys in its own order, so compare canonically (sorted keys), not by raw string.
    const canon = (v: unknown): string => Array.isArray(v) ? `[${v.map(canon).join(",")}]`
      : v && typeof v === "object" ? `{${Object.keys(v).sort().map((k) => `${k}:${canon((v as Record<string, unknown>)[k])}`).join(",")}}` : JSON.stringify(v);
    check("4 reopen keeps formatting and structure exactly", canon(g1.body?.document?.content) === canon(rich));
    check("4 owned list includes it, newest first", (await maya.req("/api/documents?scope=owned")).body?.documents?.[0]?.id === id);
    const stale = await maya.req(`/api/documents/${id}`, { method: "PATCH", json: { content: doc("stale"), baseUpdatedAt: base1 } });
    check("4 stale save is a 409 conflict, not a silent overwrite", stale.status === 409 && !!stale.body?.latest, stale.status);
    const forced = await maya.req(`/api/documents/${id}`, { method: "PATCH", json: { content: rich, baseUpdatedAt: base1, force: true } });
    check("4 'keep mine' overwrites on purpose", forced.status === 200);
    check("5 invalid content is rejected", (await maya.req(`/api/documents/${id}`, { method: "PATCH", json: { content: "<p>x</p>" } })).status === 400);
    check("5 unknown id is 404", (await maya.req("/api/documents/00000000-0000-0000-0000-000000000000")).status === 404);
    check("5 malformed id is 404", (await maya.req("/api/documents/not-a-uuid")).status === 404);

    // 3. sharing
    check("3 Daniel cannot open it before sharing", (await daniel.req(`/api/documents/${id}`)).status === 404);
    const sh = (email: string, role?: string) => maya.req(`/api/documents/${id}/share`, { method: "POST", json: { email, role } });
    check("3 invalid email is 400", (await sh("not-an-email")).status === 400);
    const unknown = await sh("nobody@docspace.dev");
    check("3 unknown user is 404 with the spec copy", unknown.status === 404 && /No DocSpace account uses nobody@docspace.dev/.test(unknown.body?.error?.message));
    check("3 own email is 409", (await sh("maya@docspace.dev")).status === 409);
    const ok = await sh("daniel@docspace.dev");
    check("3 share with Daniel as editor", ok.status === 200 && ok.body?.user?.name === "Daniel Okafor", ok.body);
    check("3 sharing again is 409 'already has access'", /already has access/.test((await sh("daniel@docspace.dev")).body?.error?.message ?? ""));
    const dShared = (await daniel.req("/api/documents?scope=shared")).body?.documents ?? [];
    check("3 Daniel sees it under Shared with me", dShared.some((d: { id: string; role: string }) => d.id === id && d.role === "editor"));
    check("3 it is not in Daniel's owned list", !((await daniel.req("/api/documents?scope=owned")).body?.documents ?? []).some((d: { id: string }) => d.id === id));
    const dEdit = await daniel.req(`/api/documents/${id}`, { method: "PATCH", json: { title: "Edited by Daniel" } });
    check("3 editor can edit", dEdit.status === 200);
    check("3 editor cannot share", (await daniel.req(`/api/documents/${id}/share`, { method: "POST", json: { email: "priya@docspace.dev" } })).status === 403);
    check("3 editor cannot delete", (await daniel.req(`/api/documents/${id}`, { method: "DELETE" })).status === 403);
    const daniels = (await maya.req(`/api/documents/${id}`)).body.document.sharedWith.find((s: { user: { email: string } }) => s.user.email === "daniel@docspace.dev");
    check("3 owner downgrades Daniel to viewer", (await maya.req(`/api/documents/${id}/share`, { method: "PATCH", json: { userId: daniels.user.id, role: "viewer" } })).status === 200);
    const vEdit = await daniel.req(`/api/documents/${id}`, { method: "PATCH", json: { title: "viewer edit" } });
    check("3 viewer edit is 403 read_only", vEdit.status === 403 && vEdit.body?.error?.code === "read_only", vEdit.body);
    check("3 owner removes Daniel", (await maya.req(`/api/documents/${id}/share`, { method: "PATCH", json: { userId: daniels.user.id, role: null } })).status === 200);
    check("3 removed user gets 404", (await daniel.req(`/api/documents/${id}`)).status === 404);

    // 2. file upload
    const up = async (name: string, text: string | Uint8Array, type = "text/plain") => {
      const fd = new FormData();
      fd.append("file", new Blob([text as BlobPart], { type }), name);
      return maya.req("/api/documents/import", { method: "POST", body: fd });
    };
    const t = await up("meeting-notes.txt", "Line one\nLine two\n\nLine three");
    if (t.body?.id) created.push(t.body.id);
    check("2 .txt import creates a document named after the file", t.status === 201 && t.body?.title === "meeting-notes", t.body);
    const tdoc = (await maya.req(`/api/documents/${t.body?.id}`)).body?.document?.content;
    check("2 each line becomes a paragraph", tdoc?.content?.length === 4 && tdoc.content[0].content[0].text === "Line one");
    const m = await up("plan.md", "# Plan\n\n- **bold** item\n- second", "text/markdown");
    if (m.body?.id) created.push(m.body.id);
    const mdoc = (await maya.req(`/api/documents/${m.body?.id}`)).body?.document?.content;
    check("2 .md import keeps headings, lists and bold", m.status === 201 && mdoc?.content?.[0]?.type === "heading" && mdoc?.content?.[1]?.type === "bulletList");
    check("2 .pdf is rejected with a clear message", /isn't a .txt or .md file/.test((await up("budget.pdf", "%PDF-1.4")).body?.error?.message ?? ""));
    check("2 binary disguised as .txt is rejected", (await up("evil.txt", new Uint8Array([0xff, 0xfe, 0x00, 0x00, 0x41]))).status === 400);
    check("2 file over 1 MB is rejected", (await up("big.txt", "a".repeat(1024 * 1024 + 10))).status === 400);
  } finally {
    for (const id of created) await maya.req(`/api/documents/${id}`, { method: "DELETE" });
    check("cleanup: test documents deleted", (await maya.req(`/api/documents/${created[0]}`)).status === 404);
    check("sign out ends the session", (await maya.req("/api/auth/logout", { method: "POST" })).status === 200 && (await maya.req("/api/documents")).status === 401);
  }
  console.log(failures ? `\n${failures} check(s) failed` : "\nAll end-to-end checks passed");
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
