"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, ArrowUpRight, FileText, MoreHorizontal, Pencil, Plus, RefreshCw, Search, Trash2, Upload, UserPlus, Users,
} from "lucide-react";
import { api, ApiFailure, Avatar, Dialog, ICON, ICON_LG, ICON_SM, Menu, MenuItem, Spinner, Tip, useToast } from "./ui";
import { useWorkspace } from "./workspace";
import { useShell } from "./AppShell";
import { ShareDialog } from "./ShareDialog";
import { normalizeTitle, timeAgo } from "@/lib/core/doc";
import type { DocSummary } from "@/lib/core/types";

export function DocumentList({ scope }: { scope: "owned" | "shared" }) {
  const { me, owned, shared, state, reload, patchDoc } = useWorkspace();
  const { newDocument, openImport, creating } = useShell();
  const [q, setQ] = useState("");
  const [sharing, setSharing] = useState<DocSummary | null>(null);
  const [deleting, setDeleting] = useState<DocSummary | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const docs = scope === "owned" ? owned : shared;
  const shown = useMemo(() => docs.filter((d) => d.title.toLowerCase().includes(q.trim().toLowerCase())), [docs, q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !t.closest("input,textarea,[contenteditable],select")) { e.preventDefault(); searchRef.current?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const head = scope === "owned"
    ? { title: "My documents", sub: "Documents you own. Share any of them by email." }
    : { title: "Shared with me", sub: "Documents other people have shared with you." };

  let body: React.ReactNode;
  if (state === "loading") body = <Skeleton />;
  else if (state === "error") body = (
    <div className="empty err">
      <div className="ei"><AlertTriangle {...ICON_LG} /></div>
      <h3>Couldn&apos;t load your documents</h3>
      <p>Check your connection and try again. Nothing you wrote is lost.</p>
      <div className="actions"><button type="button" className="btn btn-secondary" onClick={reload}><RefreshCw {...ICON} />Try again</button></div>
    </div>
  );
  else if (!docs.length) body = scope === "owned" ? (
    <div className="empty">
      <div className="ei"><FileText {...ICON_LG} /></div>
      <h3>No documents yet</h3>
      <p>Create a blank document or import a .txt or .md file to get started.</p>
      <div className="actions">
        <button type="button" className="btn btn-secondary" onClick={openImport}><Upload {...ICON} />Import file</button>
        <button type="button" className="btn btn-primary" onClick={newDocument} disabled={creating}><Plus {...ICON} />New document</button>
      </div>
    </div>
  ) : (
    <div className="empty">
      <div className="ei"><Users {...ICON_LG} /></div>
      <h3>Nothing shared with you yet</h3>
      <p>When a teammate shares a document with {me?.email}, it shows up here.</p>
    </div>
  );
  else if (!shown.length) body = (
    <div className="empty">
      <div className="ei"><Search {...ICON_LG} /></div>
      <h3>No documents match &ldquo;{q}&rdquo;</h3>
      <p>Try a different word, or clear the search.</p>
    </div>
  );
  else body = shown.map((d) => (
    <Row key={d.id} doc={d} scope={scope} meId={me?.id ?? ""} onShare={() => setSharing(d)} onDelete={() => setDeleting(d)}
      onRenamed={(title) => patchDoc(d.id, { title })} />
  ));

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>{head.title}</h1><p>{head.sub}</p></div>
        {scope === "owned" && (
          <div className="actions">
            <button type="button" className="btn btn-secondary" onClick={openImport}><Upload {...ICON} />Import</button>
            <button type="button" className="btn btn-primary" onClick={newDocument} disabled={creating}>
              {creating ? <Spinner /> : <Plus {...ICON} />}New document
            </button>
          </div>
        )}
      </div>
      <div className="toolbar-row">
        <div className="search">
          <Search {...ICON} />
          <input ref={searchRef} className="input" type="search" placeholder="Search documents" aria-label="Search documents"
            value={q} onChange={(e) => setQ(e.target.value)} />
          {!q && <kbd>/</kbd>}
        </div>
        {state === "ready" && <span className="meta">{shown.length} {shown.length === 1 ? "document" : "documents"}</span>}
      </div>
      <div className="table" role="table" aria-label={head.title} aria-busy={state === "loading"}>
        <div className="tr th" role="row">
          <span role="columnheader">Name</span><span role="columnheader" className="col-owner">Owner</span>
          <span role="columnheader" className="col-when">Last modified</span><span />
        </div>
        {body}
      </div>
      {sharing && me && (
        <ShareDialog doc={sharing} me={me} onClose={() => setSharing(null)} onChange={(sharedWith) => patchDoc(sharing.id, { sharedWith })} />
      )}
      {deleting && <DeleteDialog doc={deleting} onClose={() => setDeleting(null)} onDeleted={() => { setDeleting(null); reload(); }} />}
    </div>
  );
}

function Row({ doc, scope, meId, onShare, onDelete, onRenamed }: {
  doc: DocSummary; scope: "owned" | "shared"; meId: string; onShare: () => void; onDelete: () => void; onRenamed: (t: string) => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const moreRef = useRef<HTMLButtonElement>(null);
  const isOwner = doc.ownerId === meId;
  const canEdit = doc.role !== "viewer";
  const open = () => router.push(`/doc/${doc.id}`);
  const ownerName = isOwner ? "You" : doc.owner?.name ?? "Unknown";
  const sharedNames = doc.sharedWith.map((s) => s.user.name).join(", ");

  async function rename(raw: string) {
    setRenaming(false);
    const title = normalizeTitle(raw);
    if (title === doc.title) return;
    const prev = doc.title;
    onRenamed(title);
    try {
      await api(`/api/documents/${doc.id}`, { method: "PATCH", json: { title } });
      toast("Document renamed");
    } catch (err) {
      onRenamed(prev);
      toast(err instanceof ApiFailure ? err.message : "Couldn't rename. Try again.", "err");
    }
  }

  return (
    <div className="tr row" role="row" tabIndex={0} aria-label={`Open ${doc.title}`}
      onClick={(e) => { if (!renaming && !(e.target as HTMLElement).closest("button,input,.menu")) open(); }}
      onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) open(); }}>
      <div className="doc-name" role="cell">
        <span className={`fi${scope === "shared" ? " shared" : ""}`}>{scope === "shared" ? <Users {...ICON} /> : <FileText {...ICON} />}</span>
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            {renaming ? (
              <RenameInput initial={doc.title} onDone={rename} onCancel={() => setRenaming(false)} />
            ) : (
              <b>{doc.title}</b>
            )}
            {!renaming && isOwner && doc.sharedWith.length > 0 && (
              <Tip label={`Shared with ${sharedNames}`}>
                {(p) => <span className="sh" {...p} tabIndex={-1}><Users {...ICON_SM} />{doc.sharedWith.length}</span>}
              </Tip>
            )}
            {!renaming && scope === "shared" && doc.role === "viewer" && <span className="sh">View only</span>}
          </div>
          <span className="sub2">{ownerName} · {timeAgo(doc.updatedAt)}</span>
        </div>
      </div>
      <div className="owner col-owner" role="cell">
        {doc.owner && <Avatar user={doc.owner} />}<span>{ownerName}</span>
      </div>
      <div className="when col-when" role="cell">{timeAgo(doc.updatedAt)}</div>
      <div role="cell">
        <button ref={moreRef} type="button" className="icon-btn" aria-label={`Actions for ${doc.title}`} aria-haspopup="menu"
          aria-expanded={menu} onClick={() => setMenu((m) => !m)}><MoreHorizontal {...ICON} /></button>
        {menu && (
          <Menu anchor={moreRef} onClose={() => setMenu(false)} align="end" label="Document actions">
            <MenuItem icon={<ArrowUpRight {...ICON} />} onSelect={() => { setMenu(false); open(); }}>Open</MenuItem>
            {canEdit && <MenuItem icon={<Pencil {...ICON} />} onSelect={() => { setMenu(false); setRenaming(true); }}>Rename</MenuItem>}
            {isOwner && <MenuItem icon={<UserPlus {...ICON} />} onSelect={() => { setMenu(false); onShare(); }}>Share</MenuItem>}
            {isOwner && <><div className="sep" /><MenuItem icon={<Trash2 {...ICON} />} onSelect={() => { setMenu(false); onDelete(); }}>Delete</MenuItem></>}
          </Menu>
        )}
      </div>
    </div>
  );
}

function RenameInput({ initial, onDone, onCancel }: { initial: string; onDone: (v: string) => void; onCancel: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const done = useRef(false);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  const finish = (fn: () => void) => { if (!done.current) { done.current = true; fn(); } };
  return (
    <input ref={ref} className="input rename" defaultValue={initial} aria-label="Document name" maxLength={200}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.preventDefault(); finish(() => onDone(e.currentTarget.value)); }
        if (e.key === "Escape") { e.preventDefault(); finish(onCancel); }
      }}
      onBlur={(e) => finish(() => onDone(e.currentTarget.value))} />
  );
}

function DeleteDialog({ doc, onClose, onDeleted }: { doc: DocSummary; onClose: () => void; onDeleted: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function del() {
    setBusy(true);
    try {
      await api(`/api/documents/${doc.id}`, { method: "DELETE" });
      toast("Document deleted");
      onDeleted();
    } catch (err) {
      toast(err instanceof ApiFailure ? err.message : "Couldn't delete. Try again.", "err");
      setBusy(false);
    }
  }
  return (
    <Dialog labelId="del-title" title={`Delete "${doc.title}"?`} onClose={onClose}
      sub="This removes it for everyone it is shared with. This can't be undone."
      footer={<>
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
        <button type="button" className="btn btn-primary" style={{ background: "var(--danger)" }} onClick={del} disabled={busy}>
          {busy ? <><Spinner />Deleting…</> : "Delete"}
        </button>
      </>}>
      <span className="help">{doc.sharedWith.length ? `${doc.sharedWith.length} other ${doc.sharedWith.length === 1 ? "person" : "people"} will lose access.` : "Only you have access to this document."}</span>
    </Dialog>
  );
}

function Skeleton() {
  return (
    <>
      <span className="sr">Loading documents</span>
      {[52, 38, 60, 44, 30].map((w, i) => (
        <div key={i} className="tr" aria-hidden="true">
          <div className="doc-name"><span className="fi" /><div className="skel" style={{ width: `${w}%` }} /></div>
          <div className="col-owner"><div className="skel" style={{ width: "60%" }} /></div>
          <div className="col-when"><div className="skel" style={{ width: "50%" }} /></div>
          <span />
        </div>
      ))}
    </>
  );
}
