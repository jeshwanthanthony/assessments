// Pure document helpers: no I/O, no framework. Shared by the API, the UI and the tests.

export type Mark = { type: "bold" | "italic" | "underline" };
export type TextNode = { type: "text"; text: string; marks?: Mark[] };
export type Block =
  | { type: "paragraph"; content?: TextNode[] }
  | { type: "heading"; attrs: { level: 1 | 2 | 3 }; content?: TextNode[] }
  | { type: "bulletList" | "orderedList"; content: ListItem[] };
export type ListItem = { type: "listItem"; content: Block[] };
export type DocJSON = { type: "doc"; content: Block[] };

export const EMPTY_DOC: DocJSON = { type: "doc", content: [{ type: "paragraph" }] };

export const LIMITS = {
  importBytes: 1024 * 1024, // 1 MB, stated in the UI and README
  contentBytes: 1_000_000,
  titleChars: 200,
} as const;

export const IMPORT_TYPES = [".txt", ".md"] as const;

/** Title rules: trimmed, collapsed whitespace, 1..200 chars; empty becomes the default. */
export function normalizeTitle(raw: unknown): string {
  const t = typeof raw === "string" ? raw.replace(/\s+/g, " ").trim() : "";
  return (t || "Untitled document").slice(0, LIMITS.titleChars);
}

export function isValidEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw.trim());
}

/** Minimal structural check of editor JSON before it is stored. */
export function isDocJSON(v: unknown): v is DocJSON {
  if (!v || typeof v !== "object") return false;
  const d = v as { type?: unknown; content?: unknown };
  return d.type === "doc" && Array.isArray(d.content);
}

export type FileCheck = { ok: true; kind: "txt" | "md"; title: string } | { ok: false; message: string };

/** Same rules on client and server: .txt or .md, at most 1 MB. */
export function checkImportFile(name: string, size: number): FileCheck {
  const lower = name.toLowerCase();
  const kind = lower.endsWith(".txt") ? "txt" : lower.endsWith(".md") || lower.endsWith(".markdown") ? "md" : null;
  if (!kind) return { ok: false, message: `"${name}" isn't a .txt or .md file. Only plain text and Markdown files can be imported.` };
  if (size > LIMITS.importBytes) return { ok: false, message: `"${name}" is ${(size / 1024 / 1024).toFixed(1)} MB. The limit is 1 MB.` };
  if (size === 0) return { ok: false, message: `"${name}" is empty.` };
  return { ok: true, kind, title: normalizeTitle(name.replace(/\.(txt|md|markdown)$/i, "")) };
}

// ---------- import: plain text ----------

/** Each line break becomes a new paragraph; blank lines are kept as empty paragraphs (collapsed to one). */
export function textToDoc(text: string): DocJSON {
  const lines = text.replace(/\r\n?/g, "\n").replace(/^﻿/, "").split("\n");
  const content: Block[] = [];
  for (const line of lines) {
    const t = line.replace(/\s+$/, "");
    if (!t) {
      if (content.length && !content[content.length - 1].content) continue;
      content.push({ type: "paragraph" });
    } else content.push({ type: "paragraph", content: [{ type: "text", text: t }] });
  }
  while (content.length > 1 && !content[content.length - 1].content) content.pop();
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

// ---------- import: Markdown (the subset the editor supports) ----------

/** Inline **bold**, *italic* / _italic_, <u>underline</u>. Unknown syntax stays as text. */
export function parseInline(src: string): TextNode[] {
  const out: TextNode[] = [];
  const re = /(\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_|<u>(.+?)<\/u>)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push({ type: "text", text: src.slice(last, m.index) });
    const [, , b1, b2, i1, i2, u] = m;
    if (b1 ?? b2) out.push({ type: "text", text: (b1 ?? b2)!, marks: [{ type: "bold" }] });
    else if (i1 ?? i2) out.push({ type: "text", text: (i1 ?? i2)!, marks: [{ type: "italic" }] });
    else out.push({ type: "text", text: u!, marks: [{ type: "underline" }] });
    last = m.index + m[0].length;
  }
  if (last < src.length) out.push({ type: "text", text: src.slice(last) });
  return out.filter((n) => n.text.length > 0);
}

export function markdownToDoc(md: string): DocJSON {
  const lines = md.replace(/\r\n?/g, "\n").replace(/^﻿/, "").split("\n");
  const content: Block[] = [];
  let list: { type: "bulletList" | "orderedList"; content: ListItem[] } | null = null;
  const para = (t: string): Block => {
    const inl = parseInline(t);
    return inl.length ? { type: "paragraph", content: inl } : { type: "paragraph" };
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    const ul = /^\s*[-*+]\s+(.*)$/.exec(line);
    const ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (ul || ol) {
      const type = ul ? "bulletList" : "orderedList";
      if (!list || list.type !== type) {
        list = { type, content: [] };
        content.push(list);
      }
      list.content.push({ type: "listItem", content: [para((ul ?? ol)![1])] });
      continue;
    }
    list = null;
    if (!line.trim()) continue;
    if (h) {
      const level = Math.min(h[1].length, 3) as 1 | 2 | 3;
      const inl = parseInline(h[2]);
      content.push(inl.length ? { type: "heading", attrs: { level }, content: inl } : { type: "heading", attrs: { level } });
    } else content.push(para(line));
  }
  return { type: "doc", content: content.length ? content : [{ type: "paragraph" }] };
}

// ---------- export: Markdown ----------

function inlineToMd(nodes: TextNode[] = []): string {
  return nodes
    .map((n) => {
      let t = n.text;
      const has = (k: Mark["type"]) => n.marks?.some((m) => m.type === k);
      if (has("underline")) t = `<u>${t}</u>`;
      if (has("italic")) t = `*${t}*`;
      if (has("bold")) t = `**${t}**`;
      return t;
    })
    .join("");
}

function blockToMd(b: Block, indent = ""): string {
  switch (b.type) {
    case "heading":
      return `${"#".repeat(b.attrs.level)} ${inlineToMd(b.content)}`;
    case "paragraph":
      return indent + inlineToMd(b.content);
    case "bulletList":
    case "orderedList":
      return b.content
        .map((li, i) => {
          const marker = b.type === "bulletList" ? "-" : `${i + 1}.`;
          const [first, ...rest] = li.content;
          const head = `${indent}${marker} ${first ? blockToMd(first).trim() : ""}`;
          const tail = rest.map((r) => blockToMd(r, indent + "   "));
          return [head, ...tail].join("\n");
        })
        .join("\n");
  }
}

export function docToMarkdown(doc: DocJSON): string {
  return doc.content.map((b) => blockToMd(b)).filter((s, i, a) => s !== "" || (i > 0 && a[i - 1] !== "")).join("\n\n").trim() + "\n";
}

// ---------- display ----------

export function timeAgo(iso: string, now = Date.now()): string {
  const t = new Date(iso).getTime();
  const d = now - t;
  const M = 60e3, H = 60 * M, D = 24 * H;
  if (d < M) return "Just now";
  if (d < H) return `${Math.round(d / M)} min ago`;
  if (d < D) return `${Math.round(d / H)} h ago`;
  if (d < 2 * D) return "Yesterday";
  return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]!.toUpperCase()).join("");
}

// ---------- sharing ----------

export type ShareStatus = "ok" | "not_owner" | "no_user" | "is_owner" | "already_shared" | "bad_role";

/** Maps the database's share result to an HTTP status and the exact UI copy (UI_SPEC 4.6). */
export function shareOutcome(status: ShareStatus, email: string, name?: string, role: "editor" | "viewer" = "editor"): { http: number; message: string } {
  switch (status) {
    case "ok": return { http: 200, message: `${name} can now ${role === "viewer" ? "view" : "edit"} this document.` };
    case "no_user": return { http: 404, message: `No DocSpace account uses ${email}. Ask them to sign up first.` };
    case "is_owner": return { http: 409, message: "You already own this document." };
    case "already_shared": return { http: 409, message: `${name ?? email} already has access.` };
    case "not_owner": return { http: 403, message: "Only the owner can add people to this document." };
    case "bad_role": return { http: 400, message: "Choose Editor or Viewer." };
  }
}
