"use client";
import { useState } from "react";
import { AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { api, ApiFailure, Avatar, Dialog, ICON, ICON_SM, Spinner, useToast } from "./ui";
import { isValidEmail } from "@/lib/core/doc";
import type { DocSummary, Profile, ShareRole } from "@/lib/core/types";

type Msg = { kind: "err" | "ok"; text: string } | null;

export function ShareDialog({ doc, me, onClose, onChange }: {
  doc: DocSummary; me: Profile; onClose: () => void; onChange: (sharedWith: DocSummary["sharedWith"]) => void;
}) {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ShareRole>("editor");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const [people, setPeople] = useState(doc.sharedWith);
  const isOwner = doc.ownerId === me.id;
  const owner = doc.owner ?? me;

  const update = (next: DocSummary["sharedWith"]) => { setPeople(next); onChange(next); };

  async function invite() {
    const e = email.trim().toLowerCase();
    if (!isValidEmail(e)) return setMsg({ kind: "err", text: "Enter a valid email address." });
    setBusy(true);
    setMsg(null);
    try {
      const r = await api<{ user: Profile; role: ShareRole; message: string }>(`/api/documents/${doc.id}/share`, {
        method: "POST", json: { email: e, role },
      });
      update([...people, { user: r.user, role: r.role }]);
      setFresh(r.user.id);
      setEmail("");
      setMsg({ kind: "ok", text: r.message });
      toast(`Shared with ${r.user.name}`);
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof ApiFailure ? err.message : "Couldn't share this document. Try again." });
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(userId: string, next: ShareRole | "remove") {
    const prev = people;
    const optimistic = next === "remove" ? people.filter((p) => p.user.id !== userId) : people.map((p) => (p.user.id === userId ? { ...p, role: next } : p));
    update(optimistic);
    try {
      await api(`/api/documents/${doc.id}/share`, { method: "PATCH", json: { userId, role: next === "remove" ? null : next } });
      const name = prev.find((p) => p.user.id === userId)?.user.name;
      toast(next === "remove" ? `Removed ${name}` : `${name} is now ${next === "viewer" ? "a viewer" : "an editor"}`);
    } catch (err) {
      update(prev);
      toast(err instanceof ApiFailure ? err.message : "Couldn't update access.", "err");
    }
  }

  return (
    <Dialog labelId="share-title" title={`Share "${doc.title}"`} onClose={onClose}
      sub={isOwner ? "Editors can open and change this document. Viewers can only read it." : "People with access to this document."}
      footer={<button type="button" className="btn btn-secondary" onClick={onClose}>Done</button>}>
      {isOwner ? (
        <>
          <form className="invite" noValidate onSubmit={(e) => { e.preventDefault(); if (!busy) invite(); }}>
            <input className={`input${msg?.kind === "err" ? " err" : ""}`} type="email" autoFocus placeholder="Add people by email"
              aria-label="Email address" value={email} onChange={(e) => { setEmail(e.target.value); setMsg(null); }} />
            <select aria-label="Access level" value={role} onChange={(e) => setRole(e.target.value as ShareRole)}>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button className="btn btn-primary" type="submit" disabled={busy} aria-label={busy ? "Sharing" : undefined}>
              {busy ? <Spinner /> : "Share"}
            </button>
          </form>
          {msg && (
            <p className={`help ${msg.kind === "err" ? "err" : ""}`} role={msg.kind === "err" ? "alert" : "status"}
              style={{ margin: "8px 0 0", ...(msg.kind === "ok" ? { color: "var(--success)", display: "flex", gap: 6, alignItems: "center" } : {}) }}>
              {msg.kind === "err" ? <AlertCircle {...ICON_SM} /> : <CheckCircle2 {...ICON_SM} />}{msg.text}
            </p>
          )}
        </>
      ) : (
        <div className="alert" style={{ background: "var(--subtle)", color: "var(--text-2)" }}>
          <Lock {...ICON} /><span>Only {owner.name} can add people to this document.</span>
        </div>
      )}
      <div className="people-h">People with access</div>
      <div>
        <PersonRow user={owner} me={me} roleLabel="Owner" />
        {people.map((p) => (
          <PersonRow key={p.user.id} user={p.user} me={me} fresh={p.user.id === fresh}
            roleLabel={p.role === "viewer" ? "Viewer" : "Editor"}
            control={isOwner ? (
              <select className="role-select" aria-label={`Access for ${p.user.name}`} value={p.role}
                onChange={(e) => changeRole(p.user.id, e.target.value as ShareRole | "remove")}>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
                <option value="remove">Remove access</option>
              </select>
            ) : undefined} />
        ))}
      </div>
    </Dialog>
  );
}

function PersonRow({ user, me, roleLabel, control, fresh }: {
  user: Profile; me: Profile; roleLabel: string; control?: React.ReactNode; fresh?: boolean;
}) {
  return (
    <div className={`person${fresh ? " new" : ""}`}>
      <Avatar user={user} size="lg" />
      <div>
        <b>{user.name}{user.id === me.id && <span style={{ display: "inline", color: "var(--text-3)", fontWeight: 400 }}> (you)</span>}</b>
        <span>{user.email}</span>
      </div>
      <span className={`role${roleLabel === "Owner" ? " owner" : ""}`}>{control ?? roleLabel}</span>
    </div>
  );
}
