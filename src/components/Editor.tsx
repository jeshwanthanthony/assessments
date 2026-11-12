"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor as TEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { createBrowserClient } from "@supabase/ssr";
import {
  AlertCircle, ArrowLeft, Bold, Check, ChevronDown, Cloud, Download, Eye, FileText, History, Italic, List, ListOrdered,
  LogOut, MessageSquare, MessageSquarePlus, Printer, Redo2, Underline, Undo2, UserPlus,
} from "lucide-react";
import { api, ApiFailure, Avatar, ICON, ICON_LG, ICON_SM, Menu, MenuItem, onAuthChange, setExpectedUser, Spinner, Tip, useToast } from "./ui";
import { ShareDialog } from "./ShareDialog";
import { CommentsPanel, HistoryPanel } from "./DocPanel";
import { AccountMenu } from "./AccountMenu";
import { docToMarkdown, normalizeTitle, type DocJSON } from "@/lib/core/doc";
import { canComment as roleCanComment, canEdit, type Comment, type DocFull, type DocSummary, type Profile, type Version } from "@/lib/core/types";

type Save = "saved" | "unsaved" | "saving" | "error" | "conflict";
const DEBOUNCE_MS = 800;
const EMPTY = { type: "doc", content: [{ type: "paragraph" }] };
const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const k = (s: string) => (isMac ? s : s.replace(/⌘/g, "Ctrl+").replace(/⇧/g, "Shift+").replace(/⌥/g, "Alt+"));

export function Editor({ id }: { id: string }) {
  const [doc, setDoc] = useState<DocFull | null>(null);
  const [me, setMe] = useState<Profile | null>(null);
  const [load, setLoad] = useState<"loading" | "ready" | "missing" | "error">("loading");

  const fetchDoc = useCallback(async () => {
    setLoad("loading");
    try {
      const [d, m] = await Promise.all([
        api<{ document: DocFull }>(`/api/documents/${id}`),
        api<{ user: Profile }>("/api/me"),
      ]);
      setDoc(d.document);
      setMe(m.user);
      setExpectedUser(m.user.id);
      setLoad("ready");
    } catch (err) {
      setLoad(err instanceof ApiFailure && (err.status === 404 || err.status === 403) ? "missing" : "error");
    }
  }, [id]);
  useEffect(() => { fetchDoc(); }, [fetchDoc]);
  useEffect(() => onAuthChange(() => { api("/api/me").catch(() => {}); }), []);

  if (load === "ready" && doc && me) return <EditorView initial={doc} me={me} />;
  return (
    <div className="editor">
      <div className="topbar">
        <Link href="/" className="icon-btn" aria-label="Back to documents"><ArrowLeft {...ICON} /></Link>
        {load === "loading" && <div className="skel" style={{ width: 160 }} />}
      </div>
      <div className="canvas">
        {load === "loading" ? (
          <div className="paper" aria-busy="true">
            <span className="sr">Loading document</span>
            {[70, 90, 55].map((w) => <div key={w} className="skel" style={{ width: `${w}%`, marginBottom: 16 }} />)}
          </div>
        ) : (
          <div className="center-state">
            <div className={`empty${load === "error" ? " err" : ""}`}>
              <div className="ei">{load === "error" ? <AlertCircle {...ICON_LG} /> : <FileText {...ICON_LG} />}</div>
              <h3>{load === "error" ? "Couldn't open this document" : "This document isn't available"}</h3>
              <p>{load === "error" ? "Check your connection and try again." : "It may have been deleted, or you don't have access."}</p>
              <div className="actions">
                {load === "error" && <button type="button" className="btn btn-secondary" onClick={fetchDoc}>Try again</button>}
                <Link href="/" className="btn btn-primary">Back to documents</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EditorView({ initial, me }: { initial: DocFull; me: Profile }) {
  const toast = useToast();
  const [summary, setSummary] = useState<DocSummary>(initial);
  const [title, setTitle] = useState(initial.title);
  const [save, setSave] = useState<Save>("saved");
  const [sharing, setSharing] = useState(false);
  const [others, setOthers] = useState<Profile[]>([]);
  const readOnly = !canEdit(initial.role);
  const mayComment = roleCanComment(initial.role);
  const [panel, setPanel] = useState<"comments" | "history" | null>(null);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [draftQuote, setDraftQuote] = useState<string | null>(null);
  const [preview, setPreview] = useState<Version | null>(null);
  const [historyKey, setHistoryKey] = useState(0);
  const isOwner = initial.ownerId === me.id;

  // Save pipeline: one request in flight; changes made meanwhile are saved right after.
  const base = useRef(initial.updatedAt);
  const dirty = useRef<{ title?: string; content?: DocJSON }>({});
  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<TEditor | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createBrowserClient>["channel"]> | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const hadError = useRef(false);

  const flush = useCallback(async (force = false) => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (inFlight.current || !Object.keys(dirty.current).length) return;
    const patch = dirty.current;
    dirty.current = {};
    inFlight.current = true;
    setSave("saving");
    try {
      const r = await api<{ updatedAt: string }>(`/api/documents/${initial.id}`, {
        method: "PATCH", json: { ...patch, baseUpdatedAt: base.current, force },
      });
      base.current = r.updatedAt;
      channelRef.current?.send({ type: "broadcast", event: "saved", payload: { by: me.id, updatedAt: r.updatedAt } });
      setHistoryKey((k) => k + 1);
      if (hadError.current) { toast("All changes saved"); hadError.current = false; }
      inFlight.current = false;
      if (Object.keys(dirty.current).length) flush();
      else setSave("saved");
    } catch (err) {
      inFlight.current = false;
      dirty.current = { ...patch, ...dirty.current }; // never drop an unsaved change
      hadError.current = true;
      setSave(err instanceof ApiFailure && err.status === 409 ? "conflict" : "error");
    }
  }, [initial.id, me.id, toast]);

  const saveRef = useRef<Save>("saved");
  saveRef.current = save;
  const queue = useCallback((patch: { title?: string; content?: DocJSON }) => {
    dirty.current = { ...dirty.current, ...patch };
    // While a conflict is shown, keep collecting edits but wait for the user's choice.
    if (saveRef.current === "conflict") return;
    setSave("unsaved");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => flush(), DEBOUNCE_MS);
  }, [flush]);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        code: false, codeBlock: false, blockquote: false, strike: false, horizontalRule: false, link: false,
      }),
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
    content: initial.content,
    editorProps: {
      attributes: { class: "doc", "aria-label": "Document body", "aria-multiline": "true", role: "textbox", spellcheck: "true" },
    },
    onUpdate: ({ editor: e }) => queue({ content: e.getJSON() as DocJSON }),
  });
  editorRef.current = editor;

  // New documents open with the title selected.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new") && !readOnly) {
      titleRef.current?.focus();
      titleRef.current?.select();
      window.history.replaceState(null, "", `/doc/${initial.id}`);
    }
  }, [initial.id, readOnly]);

  // Warn before leaving with unsaved work.
  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (Object.keys(dirty.current).length || inFlight.current) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, []);

  // Stretch: who else has this document open (Supabase Realtime presence), and live refresh when idle.
  useEffect(() => {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
    const ch = sb.channel(`doc:${initial.id}`, { config: { presence: { key: me.id } } });
    channelRef.current = ch;
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState<Profile>();
      const seen = new Map<string, Profile>();
      Object.values(state).flat().forEach((p) => { if (p.id !== me.id) seen.set(p.id, { id: p.id, name: p.name, email: p.email, color: p.color }); });
      setOthers([...seen.values()]);
    });
    ch.on("broadcast", { event: "saved" }, async ({ payload }) => {
      if (payload?.by === me.id || payload?.updatedAt === base.current) return;
      // Pull the newer version only when this tab has nothing unsaved; otherwise the next save reports the conflict.
      if (Object.keys(dirty.current).length || inFlight.current) return;
      try {
        const r = await api<{ document: DocFull }>(`/api/documents/${initial.id}`);
        if (Object.keys(dirty.current).length || inFlight.current) return;
        base.current = r.document.updatedAt;
        setTitle(r.document.title);
        editorRef.current?.commands.setContent(r.document.content, { emitUpdate: false });
      } catch { /* the next save will surface any problem */ }
    });
    ch.on("broadcast", { event: "comments" }, ({ payload }) => {
      if (payload?.by !== me.id) loadCommentsRef.current();
    });
    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") ch.track({ id: me.id, name: me.name, email: me.email, color: me.color });
    });
    return () => { channelRef.current = null; sb.removeChannel(ch); };
  }, [initial.id, me]);

  async function reloadLatest() {
    try {
      const r = await api<{ document: DocFull }>(`/api/documents/${initial.id}`);
      dirty.current = {};
      base.current = r.document.updatedAt;
      setTitle(r.document.title);
      editor?.commands.setContent(r.document.content, { emitUpdate: false });
      setSave("saved");
      hadError.current = false;
    } catch {
      toast("Couldn't load the latest version.", "err");
    }
  }

  function exportMarkdown() {
    if (!editor) return;
    const md = docToMarkdown(editor.getJSON() as DocJSON);
    const url = URL.createObjectURL(new Blob([md], { type: "text/markdown;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `${normalizeTitle(title).replace(/[\\/:*?"<>|]+/g, "-")}.md` });
    a.click();
    URL.revokeObjectURL(url);
    toast("Exported as Markdown");
  }

  // ---------- comments ----------
  const loadCommentsRef = useRef<() => void>(() => {});
  loadCommentsRef.current = () => {
    api<{ comments: Comment[] }>(`/api/documents/${initial.id}/comments`)
      .then((r) => setComments(r.comments))
      .catch(() => setComments((c) => c ?? []));
  };
  useEffect(() => { loadCommentsRef.current(); }, []);
  const notifyComments = () => channelRef.current?.send({ type: "broadcast", event: "comments", payload: { by: me.id } });

  function startComment() {
    if (editor) {
      const { from, to } = editor.state.selection;
      // The editor's selection, or the browser's (a read-only editor may not hold a selection).
      const raw = from !== to ? editor.state.doc.textBetween(from, to, " ") : window.getSelection()?.toString() ?? "";
      const text = raw.replace(/\s+/g, " ").trim();
      setDraftQuote(text ? text.slice(0, 500) : null);
    }
    setPreview(null);
    setPanel("comments");
  }

  // ---------- version preview and restore ----------
  const previewEditor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] }, code: false, codeBlock: false, blockquote: false, strike: false, horizontalRule: false, link: false })],
    content: EMPTY,
    editorProps: { attributes: { class: "doc", "aria-label": "Version preview", role: "document" } },
  });
  async function selectVersion(v: Version | null) {
    setPreview(v);
    if (!v || !previewEditor) return;
    try {
      const r = await api<{ version: { content: DocJSON } }>(`/api/documents/${initial.id}/versions/${v.id}`);
      previewEditor.commands.setContent(r.version.content, { emitUpdate: false });
    } catch {
      toast("Couldn't load this version.", "err");
      setPreview(null);
    }
  }
  async function restore() {
    if (!preview) return;
    try {
      if (Object.keys(dirty.current).length) await flush(true);
      const r = await api<{ updatedAt: string; title: string; content: DocJSON }>(`/api/documents/${initial.id}/versions/${preview.id}`, { method: "POST" });
      dirty.current = {};
      base.current = r.updatedAt;
      setTitle(r.title);
      editor?.commands.setContent(r.content, { emitUpdate: false });
      setSave("saved");
      setPreview(null);
      setHistoryKey((k) => k + 1);
      channelRef.current?.send({ type: "broadcast", event: "saved", payload: { by: me.id, updatedAt: r.updatedAt } });
      toast("Version restored");
    } catch (err) {
      toast(err instanceof ApiFailure ? err.message : "Couldn't restore this version.", "err");
    }
  }

  const openThreads = (comments ?? []).filter((c) => !c.parentId && !c.resolved).length;
  const roleNote = initial.role === "commenter"
    ? `You can comment but not edit. Ask ${initial.owner?.name ?? "the owner"} for edit access.`
    : `You have view-only access. Ask ${initial.owner?.name ?? "the owner"} for edit access.`;
  const back = isOwner ? "/" : "/shared";
  return (
    <div className="editor">
      <header className="topbar">
        <Tip label="Back to documents">{(p) => <Link href={back} className="icon-btn" aria-label="Back to documents" {...p}><ArrowLeft {...ICON} /></Link>}</Tip>
        <input ref={titleRef} className="title-in" aria-label="Document title" value={title} readOnly={readOnly} maxLength={200}
          size={Math.max(8, Math.min(title.length + 1, 48))}
          onChange={(e) => { setTitle(e.target.value); queue({ title: normalizeTitle(e.target.value) }); }}
          onBlur={() => { if (!title.trim()) { setTitle("Untitled document"); queue({ title: "Untitled document" }); } }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); editor?.commands.focus(); } }} />
        {readOnly ? <span className="ro-pill">{mayComment ? <MessageSquare {...ICON_SM} /> : <Eye {...ICON_SM} />}<span className="lbl">{mayComment ? "Can comment" : "View only"}</span></span> : <SaveStatus state={save} onRetry={() => flush()} onReload={reloadLatest} onKeep={() => flush(true)} />}
        <div className="grow" />
        {others.length > 0 && (
          <Tip label={`Also here: ${others.map((o) => o.name).join(", ")}`}>
            {(p) => <span className="presence" {...p} tabIndex={0} aria-label={`Also viewing: ${others.map((o) => o.name).join(", ")}`}>
              {others.slice(0, 3).map((o) => <Avatar key={o.id} user={o} />)}
            </span>}
          </Tip>
        )}
        {!isOwner && initial.owner && (
          <span className="shared-pill"><Avatar user={initial.owner} />Owned by {initial.owner.name}</span>
        )}
        {mayComment && (
          <Tip label="Comment on selection" kbd={k("⌘⌥M")}>
            {(p) => <button type="button" className="icon-btn hide-sm" aria-label="Comment on selection" {...p}
              onMouseDown={(e) => { e.preventDefault(); p.onMouseDown(); }} onClick={startComment}><MessageSquarePlus {...ICON} /></button>}
          </Tip>
        )}
        <Tip label="Comments">
          {(p) => <button type="button" className="icon-btn" style={{ position: "relative" }} aria-label={`Comments (${openThreads} open)`} aria-pressed={panel === "comments"} {...p}
            onClick={() => { setPreview(null); setPanel((x) => (x === "comments" ? null : "comments")); }}>
            <MessageSquare {...ICON} />{openThreads > 0 && <span className="tb-badge" aria-hidden="true">{openThreads}</span>}
          </button>}
        </Tip>
        <Tip label="Version history">
          {(p) => <button type="button" className="icon-btn" aria-label="Version history" aria-pressed={panel === "history"} {...p}
            onClick={() => { setPreview(null); setPanel((x) => (x === "history" ? null : "history")); }}><History {...ICON} /></button>}
        </Tip>
        <ExportMenu onMarkdown={exportMarkdown} />
        <button type="button" className="btn btn-accent" onClick={() => setSharing(true)}><UserPlus {...ICON} /><span className="share-lbl">Share</span></button>
        <AccountButton me={me} />
      </header>
      {!readOnly && editor && !preview && <Toolbar editor={editor} />}
      <div className="editor-body">
        <div className="canvas"
          onKeyDown={(e) => { if (mayComment && e.altKey && (e.metaKey || e.ctrlKey) && e.code === "KeyM") { e.preventDefault(); startComment(); } }}>
          {preview && (
            <div className="preview-banner" role="status">
              <History {...ICON_SM} />
              <span className="grow">Previewing {new Date(preview.updatedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} by {preview.savedBy?.name ?? "unknown"}</span>
              <button type="button" className="btn btn-secondary" style={{ height: 28 }} onClick={() => setPreview(null)}>Back to current</button>
              {!readOnly && <button type="button" className="btn btn-accent" style={{ height: 28 }} onClick={restore}>Restore this version</button>}
            </div>
          )}
          <div className="paper" style={preview ? { display: "none" } : undefined}><EditorContent editor={editor} /></div>
          {preview && <div className="paper"><EditorContent editor={previewEditor} /></div>}
          {readOnly && !preview && <p className="readonly-note">{mayComment ? <MessageSquare {...ICON_SM} /> : <Eye {...ICON_SM} />}{roleNote}</p>}
        </div>
        {panel === "comments" && (
          <CommentsPanel docId={initial.id} me={me} ownerId={initial.ownerId} canComment={mayComment}
            comments={comments} setComments={(f) => setComments((c) => f(c ?? []))}
            draftQuote={draftQuote} clearQuote={() => setDraftQuote(null)} editor={editor}
            onClose={() => setPanel(null)} notify={notifyComments} />
        )}
        {panel === "history" && (
          <HistoryPanel docId={initial.id} canRestore={!readOnly} selected={preview?.id ?? null} refreshKey={historyKey}
            onSelect={selectVersion} onClose={() => { setPreview(null); setPanel(null); }} />
        )}
      </div>
      {sharing && (
        <ShareDialog doc={{ ...summary, title }} me={me} onClose={() => setSharing(false)}
          onChange={(sharedWith) => setSummary((s) => ({ ...s, sharedWith }))} />
      )}
    </div>
  );
}

function SaveStatus({ state, onRetry, onReload, onKeep }: { state: Save; onRetry: () => void; onReload: () => void; onKeep: () => void }) {
  return (
    <span className={`save${state === "error" || state === "conflict" ? " err" : state === "unsaved" ? " unsaved" : ""}`} aria-live="polite">
      {state === "saved" && <><Cloud {...ICON_SM} /><span className="lbl">Saved</span></>}
      {state === "unsaved" && <><span style={{ width: 6, height: 6, borderRadius: 9, background: "currentColor" }} /><span className="lbl">Unsaved changes</span></>}
      {state === "saving" && <><Spinner sm /><span className="lbl">Saving…</span></>}
      {state === "error" && <><AlertCircle {...ICON_SM} /><span className="lbl">Couldn&apos;t save.</span><button type="button" onClick={onRetry}>Retry</button></>}
      {state === "conflict" && <>
        <AlertCircle {...ICON_SM} /><span className="lbl">Someone else saved a newer version.</span>
        <button type="button" onClick={onReload}>Load theirs</button><button type="button" onClick={onKeep}>Keep mine</button>
      </>}
    </span>
  );
}

function Toolbar({ editor }: { editor: TEditor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"), italic: e.isActive("italic"), underline: e.isActive("underline"),
      bullet: e.isActive("bulletList"), ordered: e.isActive("orderedList"),
      block: e.isActive("heading", { level: 1 }) ? 1 : e.isActive("heading", { level: 2 }) ? 2 : e.isActive("heading", { level: 3 }) ? 3 : 0,
      undo: e.can().undo(), redo: e.can().redo(),
    }),
  });
  const [blkOpen, setBlkOpen] = useState(false);
  const blkRef = useRef<HTMLButtonElement>(null);
  const c = () => editor.chain().focus();
  const blocks = [
    { level: 0, label: "Paragraph", cls: "blk-p", kbd: "⌘⌥0" },
    { level: 1, label: "Heading 1", cls: "blk-h1", kbd: "⌘⌥1" },
    { level: 2, label: "Heading 2", cls: "blk-h2", kbd: "⌘⌥2" },
    { level: 3, label: "Heading 3", cls: "blk-h3", kbd: "⌘⌥3" },
  ] as const;
  const setBlock = (level: number) => {
    if (level === 0) c().setParagraph().run();
    else c().toggleHeading({ level: level as 1 | 2 | 3 }).run();
  };
  const tb = (label: string, kbd: string, on: boolean | null, icon: React.ReactNode, run: () => void, disabled = false) => (
    <Tip label={label} kbd={k(kbd)}>
      {(p) => (
        <button type="button" className={`tb${on ? " on" : ""}`} aria-label={label} aria-pressed={on ?? undefined} disabled={disabled}
          {...p} onMouseDown={(e) => { e.preventDefault(); p.onMouseDown(); }} onClick={run}>{icon}</button>
      )}
    </Tip>
  );
  return (
    <div className="fmt" role="toolbar" aria-label="Formatting">
      {tb("Undo", "⌘Z", null, <Undo2 {...ICON} />, () => c().undo().run(), !s.undo)}
      {tb("Redo", "⌘⇧Z", null, <Redo2 {...ICON} />, () => c().redo().run(), !s.redo)}
      <span className="tsep" />
      <button ref={blkRef} type="button" className="tb blk" aria-haspopup="menu" aria-expanded={blkOpen} aria-label={`Text style: ${blocks[s.block].label}`}
        onMouseDown={(e) => e.preventDefault()} onClick={() => setBlkOpen((o) => !o)}>
        {blocks[s.block].label}<ChevronDown {...ICON_SM} />
      </button>
      {blkOpen && (
        <Menu anchor={blkRef} onClose={() => setBlkOpen(false)} label="Text style">
          {blocks.map((b) => (
            <MenuItem key={b.level} className="tall" onSelect={() => { setBlkOpen(false); setBlock(b.level); }}
              right={<>{s.block === b.level && <Check {...ICON} className="chk" />}<kbd style={{ marginLeft: s.block === b.level ? 8 : "auto" }}>{k(b.kbd)}</kbd></>}>
              <span className={b.cls}>{b.label}</span>
            </MenuItem>
          ))}
        </Menu>
      )}
      <span className="tsep" />
      {tb("Bold", "⌘B", s.bold, <Bold {...ICON} />, () => c().toggleBold().run())}
      {tb("Italic", "⌘I", s.italic, <Italic {...ICON} />, () => c().toggleItalic().run())}
      {tb("Underline", "⌘U", s.underline, <Underline {...ICON} />, () => c().toggleUnderline().run())}
      <span className="tsep" />
      {tb("Bulleted list", "⌘⇧8", s.bullet, <List {...ICON} />, () => c().toggleBulletList().run())}
      {tb("Numbered list", "⌘⇧7", s.ordered, <ListOrdered {...ICON} />, () => c().toggleOrderedList().run())}
    </div>
  );
}

function ExportMenu({ onMarkdown }: { onMarkdown: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <>
      <Tip label="Export as PDF or Markdown">
        {(p) => <button ref={ref} type="button" className="btn btn-ghost export-btn" aria-label="Export as PDF or Markdown" aria-haspopup="menu" aria-expanded={open} {...p}
          onClick={() => setOpen((o) => !o)}><Download {...ICON} /><span className="export-lbl">Export</span></button>}
      </Tip>
      {open && (
        <Menu anchor={ref} onClose={() => setOpen(false)} align="end" label="Export">
          <div className="hd">Export</div>
          <MenuItem icon={<FileText {...ICON} />} onSelect={() => { setOpen(false); onMarkdown(); }}>Markdown (.md)</MenuItem>
          <MenuItem icon={<Printer {...ICON} />} onSelect={() => { setOpen(false); setTimeout(() => window.print(), 50); }}>Print or save as PDF</MenuItem>
        </Menu>
      )}
    </>
  );
}

function AccountButton({ me }: { me: Profile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={ref} type="button" className="icon-btn" style={{ width: 28 }} aria-label="Accounts" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Avatar user={me} />
      </button>
      {open && <AccountMenu anchor={ref} onClose={() => setOpen(false)} me={me} align="end" showDocsLink />}
    </>
  );
}
