"use client";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { AlertTriangle, Check, FileText, LogOut, Trash2, UserPlus } from "lucide-react";
import {
  announceAuthChange, api, ApiFailure, Avatar, Dialog, ICON, ICON_SM, Menu, MenuItem, setExpectedUser, Spinner, useToast,
} from "./ui";
import type { Profile } from "@/lib/core/types";

type Accounts = { accounts: Profile[]; defaultAccount: string | null };

/** After signing an account out or deleting it: this tab follows the browser default account; other tabs re-check theirs. */
function afterSignOut() {
  setExpectedUser(null);
  announceAuthChange();
  window.location.href = "/"; // no account left: the router sends this tab to /login
}

/**
 * The account switcher: every account signed in on this browser. Switching changes THIS tab only
 * (no password), so two tabs can use two accounts side by side. Add, sign out of one or all, delete.
 */
export function AccountMenu({ anchor, onClose, me, up, align, showDocsLink }: {
  anchor: RefObject<HTMLElement | null>; onClose: () => void; me: Profile; up?: boolean; align?: "start" | "end"; showDocsLink?: boolean;
}) {
  const toast = useToast();
  const [accounts, setAccounts] = useState<Accounts | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    api<Accounts>("/api/auth/accounts").then(setAccounts).catch(() => setAccounts({ accounts: [me], defaultAccount: me.id }));
  }, [me]);

  function switchTo(a: Profile) {
    setBusy(a.id);
    setExpectedUser(a.id); // this tab only; other tabs keep their account
    window.location.reload();
  }

  async function signOut(all: boolean) {
    setBusy(all ? "all" : "one");
    await api("/api/auth/logout", { method: "POST", json: all ? { all: true } : { userId: me.id } }).catch(() => {});
    afterSignOut();
  }

  const others = (accounts?.accounts ?? []).filter((a) => a.id !== me.id);
  if (deleting) return <DeleteAccountDialog me={me} onClose={() => { setDeleting(false); onClose(); }} />;
  return (
    <Menu anchor={anchor} onClose={onClose} up={up} align={align} label="Accounts">
      <div className="hd">This tab</div>
      <MenuItem className="tall acct-row" onSelect={onClose} icon={<Avatar user={me} />} right={<Check {...ICON} className="chk" />}>
        <span className="acct-txt"><b>{me.name}</b><span>{me.email}</span></span>
      </MenuItem>
      {accounts === null ? (
        <div className="hd" style={{ display: "flex", gap: 6, alignItems: "center" }}><Spinner sm />Loading accounts</div>
      ) : others.length > 0 && <div className="hd">Switch this tab to</div>}
      {accounts !== null && others.map((a) => (
        <MenuItem key={a.id} className="tall acct-row" onSelect={() => switchTo(a)} disabled={!!busy}
          icon={<Avatar user={a} />} right={busy === a.id ? <Spinner sm /> : undefined}>
          <span className="acct-txt"><b>{a.name}</b><span>{a.email}</span></span>
        </MenuItem>
      ))}
      <MenuItem icon={<UserPlus {...ICON} />} onSelect={() => { window.location.href = "/login?add=1"; }}>Add another account</MenuItem>
      <div className="sep" />
      {showDocsLink && <MenuItem icon={<FileText {...ICON} />} onSelect={() => { window.location.href = "/"; }}>My documents</MenuItem>}
      <MenuItem icon={<LogOut {...ICON} />} onSelect={() => signOut(false)} disabled={!!busy}>
        {others.length ? `Sign out of ${me.email}` : "Sign out"}
      </MenuItem>
      {others.length > 0 && <MenuItem icon={<LogOut {...ICON} />} onSelect={() => signOut(true)} disabled={!!busy}>Sign out of all accounts</MenuItem>}
      <div className="sep" />
      <MenuItem icon={<Trash2 {...ICON} />} className="danger-item" onSelect={() => setDeleting(true)}>Delete account…</MenuItem>
    </Menu>
  );
}

function DeleteAccountDialog({ me, onClose }: { me: Profile; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const ref = useRef<HTMLInputElement>(null);
  async function del() {
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api("/api/account/delete", { method: "POST", json: { password } });
      toast("Account deleted");
      afterSignOut();
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "Couldn't delete the account. Try again.");
      setBusy(false);
      ref.current?.focus();
    }
  }
  const item = (t: ReactNode) => <li>{t}</li>;
  return (
    <Dialog labelId="del-acct" title="Delete your account?" onClose={busy ? () => {} : onClose}
      sub={`${me.email} will be removed for good. This can't be undone.`}
      footer={<>
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
        <button type="button" className="btn btn-primary" style={{ background: "var(--danger)" }} onClick={del} disabled={!password || busy}>
          {busy ? <><Spinner />Deleting…</> : "Delete account"}
        </button>
      </>}>
      <div className="alert danger" style={{ marginBottom: 14 }}>
        <AlertTriangle {...ICON} />
        <div>
          This permanently deletes:
          <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
            {item("every document you own, for everyone it is shared with")}
            {item("their comments and version history")}
            {item("your access to documents others shared with you, and your comments on them")}
          </ul>
        </div>
      </div>
      <form className="field" noValidate onSubmit={(e) => { e.preventDefault(); del(); }}>
        <label className="label" htmlFor="del-pw">Enter your password to confirm</label>
        <input ref={ref} id="del-pw" className={`input${error ? " err" : ""}`} type="password" autoComplete="current-password" autoFocus
          value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} />
        {error && <p className="help err" role="alert"><AlertTriangle {...ICON_SM} />{error}</p>}
      </form>
    </Dialog>
  );
}
