"use client";
import { useRef, useState } from "react";
import { AlertCircle, FileText, FileUp, Info, X } from "lucide-react";
import { api, ApiFailure, Dialog, ICON, ICON_SM, Spinner, useToast } from "./ui";
import { checkImportFile } from "@/lib/core/doc";

const fmtSize = (b: number) => (b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

export function ImportDialog({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  function pick(f: File | undefined) {
    if (!f) return;
    const c = checkImportFile(f.name, f.size);
    setFile(c.ok ? f : null);
    setError(c.ok ? null : c.message);
  }

  async function submit() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setProgress(10);
    requestAnimationFrame(() => setProgress(80));
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await api<{ id: string; title: string }>("/api/documents/import", { method: "POST", body: fd });
      setProgress(100);
      toast(`Imported "${r.title}"`);
      window.location.href = `/doc/${r.id}`;
    } catch (err) {
      setError(err instanceof ApiFailure && err.status === 400 ? err.message : "Couldn't import this file. Try again.");
      setBusy(false);
      setProgress(0);
    }
  }

  const check = file ? checkImportFile(file.name, file.size) : null;
  return (
    <Dialog labelId="import-title" title="Import a file" sub="The file becomes a new document you can edit." onClose={busy ? () => {} : onClose}
      footer={<>
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={submit} disabled={!file || busy}>
          {busy ? <><Spinner />Importing…</> : "Import"}
        </button>
      </>}>
      <input ref={input} type="file" accept=".txt,.md,.markdown,text/plain,text/markdown" hidden
        onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
      {file ? (
        <>
          <div className="file">
            <span className="fi"><FileText {...ICON} /></span>
            <div><b>{file.name}</b><span>{fmtSize(file.size)} · {check?.ok && check.kind === "md" ? "Markdown" : "Plain text"}</span></div>
            <button type="button" className="icon-btn" aria-label="Remove file" disabled={busy} onClick={() => setFile(null)}><X {...ICON} /></button>
          </div>
          {busy && <div className="bar" aria-hidden="true"><i style={{ width: `${progress}%` }} /></div>}
          <p className="note"><Info {...ICON_SM} />Creates a new document named &quot;{check?.ok ? check.title : ""}&quot;.</p>
        </>
      ) : (
        <>
          <button type="button" className={`drop${over ? " over" : ""}${error ? " err" : ""}`} style={{ width: "100%" }}
            onClick={() => input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files?.[0]); }}>
            <span className="ei" style={{ display: "grid" }}><FileUp {...ICON} /></span>
            <span><b>Drag a .txt or .md file here</b> or <span className="link">browse</span></span>
            <p>Plain text (.txt) or Markdown (.md), up to 1 MB</p>
          </button>
          <p className="note"><Info {...ICON_SM} />Each line break becomes a new paragraph; Markdown headings, lists, bold and italic are kept. The file name becomes the document title.</p>
        </>
      )}
      {error && <p className="help err" role="alert" style={{ marginTop: 10 }}><AlertCircle {...ICON_SM} />{error}</p>}
    </Dialog>
  );
}
