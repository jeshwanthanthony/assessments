"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Editor as TEditor } from "@tiptap/react";
import { Check, CornerDownRight, History, MessageSquare, RotateCcw, Trash2, X } from "lucide-react";
import { api, ApiFailure, Avatar, ICON, ICON_SM, Spinner, useToast } from "./ui";
import { timeAgo } from "@/lib/core/doc";
import type { Comment, Profile, Version } from "@/lib/core/types";

// ---------- find quoted text in the document ----------

/** Selects the first occurrence of `quote` inside one text block and scrolls to it. Returns false if it is gone. */
export function revealQuote(editor: TEditor, quote: string): boolean {
  let found: { from: number; to: number } | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (found || !node.isTextblock) return !found;
    const i = node.textContent.indexOf(quote);
    if (i >= 0) found = { from: pos + 1 + i, to: pos + 1 + i + quote.length };
    return false;
  });
  if (!found) return false;
  editor.chain().setTextSelection(found).scrollIntoView().run();
  editor.view.focus();
  return true;
}

// ---------- comments ----------

export function CommentsPanel({ docId, me, ownerId, canComment, comments, setComments, draftQuote, clearQuote, editor, onClose, notify }: {
  docId: string; me: Profile; ownerId: string; canComment: boolean;
  comments: Comment[] | null; setComments: (f: (c: Comment[]) => Comment[]) => void;
  draftQuote: string | null; clearQuote: () => void; editor: TEditor | null; onClose: () => void; notify: () => void;
}) {
  const toast = useToast();
  const [filter, setFilter] = useState<"open" | "resolved">("open");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (draftQuote) boxRef.current?.focus(); }, [draftQuote]);

  const threads = useMemo(() => {
    const roots = (comments ?? []).filter((c) => !c.parentId);
    return roots
      .filter((c) => (filter === "open" ? !c.resolved : c.resolved))
      .map((root) => ({ root, replies: (comments ?? []).filter((c) => c.parentId === root.id) }));
  }, [comments, filter]);

  async function post(text: string, parentId: string | null, quote: string | null) {
    const r = await api<{ comment: Comment }>(`/api/documents/${docId}/comments`, { method: "POST", json: { body: text, parentId, quote } });
    setComments((c) => [...c, r.comment]);
    notify();
  }

  async function submit() {
    if (!body.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await post(body.trim(), null, draftQuote);
      setBody("");
      clearQuote();
      setFilter("open");
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "Couldn't post your comment. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function resolve(c: Comment, resolved: boolean) {
    setComments((list) => list.map((x) => (x.id === c.id ? { ...x, resolved } : x)));
    try {
      await api(`/api/documents/${docId}/comments/${c.id}`, { method: "PATCH", json: { resolved } });
      toast(resolved ? "Comment resolved" : "Comment reopened");
      notify();
    } catch (err) {
      setComments((list) => list.map((x) => (x.id === c.id ? { ...x, resolved: !resolved } : x)));
      toast(err instanceof ApiFailure ? err.message : "Couldn't update the comment.", "err");
    }
  }

  async function remove(c: Comment) {
    try {
      await api(`/api/documents/${docId}/comments/${c.id}`, { method: "DELETE" });
      setComments((list) => list.filter((x) => x.id !== c.id && x.parentId !== c.id));
      toast("Comment deleted");
      notify();
    } catch (err) {
      toast(err instanceof ApiFailure ? err.message : "Couldn't delete the comment.", "err");
    }
  }

  const openCount = (comments ?? []).filter((c) => !c.parentId && !c.resolved).length;
  const resolvedCount = (comments ?? []).filter((c) => !c.parentId && c.resolved).length;
  return (
    <aside className="panel" aria-label="Comments">
      <div className="panel-h">
        <MessageSquare {...ICON} /><h2>Comments</h2>
        <button type="button" className="icon-btn" aria-label="Close comments" onClick={onClose}><X {...ICON} /></button>
      </div>
      <div className="panel-b">
        <div className="seg" role="tablist" aria-label="Filter comments">
          <button type="button" role="tab" aria-selected={filter === "open"} className={filter === "open" ? "on" : ""} onClick={() => setFilter("open")}>Open {openCount}</button>
          <button type="button" role="tab" aria-selected={filter === "resolved"} className={filter === "resolved" ? "on" : ""} onClick={() => setFilter("resolved")}>Resolved {resolvedCount}</button>
        </div>
        {comments === null ? (
          <div className="panel-empty"><Spinner /></div>
        ) : threads.length === 0 ? (
          <p className="panel-empty">
            {filter === "open"
              ? canComment ? "No open comments. Select text in the document, then add a comment below." : "No open comments."
              : "No resolved comments."}
          </p>
        ) : (
          threads.map(({ root, replies }) => (
            <Thread key={root.id} root={root} replies={replies} me={me} ownerId={ownerId} canComment={canComment}
              onReveal={(q) => { if (editor && !revealQuote(editor, q)) toast("That text is no longer in the document.", "err"); }}
              onReply={(text) => post(text, root.id, null)} onResolve={resolve} onDelete={remove} />
          ))
        )}
      </div>
      {canComment && (
        <form className="panel-f" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          {draftQuote && (
            <div className="compose-quote"><span title={draftQuote}>&ldquo;{draftQuote}&rdquo;</span>
              <button type="button" className="icon-btn" style={{ width: 20, height: 20 }} aria-label="Remove quoted text" onClick={clearQuote}><X {...ICON_SM} /></button>
            </div>
          )}
          <textarea ref={boxRef} className="textarea" aria-label="New comment" maxLength={2000}
            placeholder={draftQuote ? "Comment on the selected text…" : "Add a comment…"} value={body}
            onChange={(e) => { setBody(e.target.value); setError(null); }}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); } }} />
          {error && <p className="help err" role="alert" style={{ margin: "6px 0 0" }}>{error}</p>}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={!body.trim() || busy}>{busy ? <Spinner /> : "Comment"}</button>
            <span className="help">Ctrl/⌘ + Enter</span>
          </div>
        </form>
      )}
    </aside>
  );
}

function Thread({ root, replies, me, ownerId, canComment, onReveal, onReply, onResolve, onDelete }: {
  root: Comment; replies: Comment[]; me: Profile; ownerId: string; canComment: boolean;
  onReveal: (q: string) => void; onReply: (t: string) => Promise<void>;
  onResolve: (c: Comment, r: boolean) => void; onDelete: (c: Comment) => void;
}) {
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const canDelete = (c: Comment) => c.author?.id === me.id || me.id === ownerId;
  async function send() {
    if (!text.trim()) return;
    setBusy(true);
    try { await onReply(text.trim()); setText(""); setReplying(false); }
    catch (err) { toast(err instanceof ApiFailure ? err.message : "Couldn't post your reply.", "err"); }
    finally { setBusy(false); }
  }
  return (
    <div className={`thread${root.resolved ? " resolved" : ""}`}>
      {root.quote && (
        <p className="quote" role="button" tabIndex={0} title="Show in document"
          onClick={() => onReveal(root.quote!)} onKeyDown={(e) => e.key === "Enter" && onReveal(root.quote!)}>{root.quote}</p>
      )}
      {[root, ...replies].map((c) => (
        <div key={c.id} className="cmt">
          {c.author && <Avatar user={c.author} />}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="who"><b>{c.author?.name ?? "Someone"}</b><span>{timeAgo(c.createdAt)}</span></div>
            <p>{c.body}</p>
          </div>
          {canDelete(c) && (
            <button type="button" className="icon-btn" style={{ width: 24, height: 24 }} aria-label="Delete comment" onClick={() => onDelete(c)}><Trash2 {...ICON_SM} /></button>
          )}
        </div>
      ))}
      {canComment && (
        replying ? (
          <form onSubmit={(e) => { e.preventDefault(); send(); }} style={{ marginTop: 8 }}>
            <textarea className="textarea" autoFocus aria-label="Reply" placeholder="Reply…" maxLength={2000} value={text} style={{ minHeight: 48 }}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } if (e.key === "Escape") setReplying(false); }} />
            <div className="thread-actions" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-ghost" onClick={() => setReplying(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={!text.trim() || busy}>{busy ? <Spinner /> : "Reply"}</button>
            </div>
          </form>
        ) : (
          <div className="thread-actions">
            {!root.resolved && <button type="button" className="btn btn-ghost" onClick={() => setReplying(true)}><CornerDownRight {...ICON_SM} />Reply</button>}
            <button type="button" className="btn btn-ghost" onClick={() => onResolve(root, !root.resolved)}>
              {root.resolved ? <><RotateCcw {...ICON_SM} />Reopen</> : <><Check {...ICON_SM} />Resolve</>}
            </button>
          </div>
        )
      )}
    </div>
  );
}

// ---------- version history ----------

export function HistoryPanel({ docId, canRestore, selected, onSelect, onClose, refreshKey }: {
  docId: string; canRestore: boolean; selected: string | null; refreshKey: number;
  onSelect: (v: Version | null) => void; onClose: () => void;
}) {
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let live = true;
    setError(false);
    api<{ versions: Version[] }>(`/api/documents/${docId}/versions`)
      .then((r) => live && setVersions(r.versions))
      .catch(() => live && setError(true));
    return () => { live = false; };
  }, [docId, refreshKey]);
  return (
    <aside className="panel" aria-label="Version history">
      <div className="panel-h">
        <History {...ICON} /><h2>Version history</h2>
        <button type="button" className="icon-btn" aria-label="Close version history" onClick={onClose}><X {...ICON} /></button>
      </div>
      <div className="panel-b">
        <p className="help" style={{ margin: "0 0 10px" }}>
          A version is kept for each person&apos;s editing session (up to 50).{canRestore ? " Select one to preview or restore it." : " Select one to preview it."}
        </p>
        {error ? <p className="panel-empty">Couldn&apos;t load version history.</p>
          : versions === null ? <div className="panel-empty"><Spinner /></div>
          : versions.length === 0 ? <p className="panel-empty">No versions yet. One is saved when the document changes.</p>
          : versions.map((v, i) => (
            <button key={v.id} type="button" className={`ver${selected === v.id || (!selected && i === 0) ? " on" : ""}`}
              aria-current={selected === v.id || (!selected && i === 0) ? "true" : undefined}
              onClick={() => onSelect(i === 0 ? null : v)}>
              {v.savedBy ? <Avatar user={v.savedBy} /> : <span className="av" style={{ background: "var(--text-3)" }} />}
              <div>
                <b>{i === 0 ? "Current version" : new Date(v.updatedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</b>
                <span>{v.savedBy?.name ?? "Unknown"} · {timeAgo(v.updatedAt)}</span>
              </div>
            </button>
          ))}
      </div>
    </aside>
  );
}
