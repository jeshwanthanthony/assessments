// Measures sharing and API latency against a deployed app (BASE=...). Creates and deletes one document.
export {};
const BASE = process.env.BASE ?? "https://docspace-ajaia.netlify.app";
const jar = new Map<string, string>();
async function req(path: string, json?: unknown, method = json ? "POST" : "GET") {
  const h: Record<string, string> = {}; if (json) h["content-type"] = "application/json";
  if (jar.size) h.cookie = [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
  const t = performance.now();
  const r = await fetch(BASE + path, { method, headers: h, body: json ? JSON.stringify(json) : undefined });
  for (const c of r.headers.getSetCookie()) { const [p] = c.split(";"); const i = p.indexOf("="); const v = p.slice(i + 1); if (v) jar.set(p.slice(0, i), v); else jar.delete(p.slice(0, i)); }
  const b = await r.json().catch(() => null);
  return { s: r.status, ms: Math.round(performance.now() - t), b };
}
(async () => {
  await req("/api/auth/login", { email: "maya@docspace.dev", password: "demo1234" });
  const d = await req("/api/documents", { title: "perf" });
  for (let i = 0; i < 4; i++) {
    const s = await req(`/api/documents/${d.b.id}/share`, { email: "priya@docspace.dev", role: "viewer" });
    const me = await req("/api/me");
    const g = await req(`/api/documents/${d.b.id}`);
    console.log(`share ${s.s} ${s.ms}ms | me ${me.ms}ms | get doc ${g.ms}ms`);
    const pid = g.b.document.sharedWith[0]?.user.id; if (pid) await req(`/api/documents/${d.b.id}/share`, { userId: pid, role: null }, "PATCH");
  }
  await req(`/api/documents/${d.b.id}`, undefined, "DELETE");
})();
