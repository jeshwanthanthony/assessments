"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Check, ChevronsUpDown, FileText, LogOut, Menu as MenuIcon, Plus, Upload, Users } from "lucide-react";
import { announceAuthChange, api, Avatar, ICON, Logo, Menu, MenuItem, setExpectedUser, Spinner, useToast } from "./ui";
import { useWorkspace, WorkspaceProvider } from "./workspace";
import { ImportDialog } from "./ImportDialog";
import { AccountMenu } from "./AccountMenu";

type ShellActions = { newDocument: () => Promise<void>; openImport: () => void; creating: boolean };
const ShellCtx = createContext<ShellActions | null>(null);
export const useShell = () => useContext(ShellCtx)!;

export function AppShell({ children }: { children: ReactNode }) {
  return <WorkspaceProvider><Shell>{children}</Shell></WorkspaceProvider>;
}

export async function signOut() {
  await api("/api/auth/logout", { method: "POST", json: { all: true } }).catch(() => {});
  setExpectedUser(null);
  announceAuthChange();
  window.location.href = "/login";
}

function Shell({ children }: { children: ReactNode }) {
  const { me, owned, shared, reload, state } = useWorkspace();
  const toast = useToast();
  const path = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  const acctRef = useRef<HTMLButtonElement>(null);

  const newDocument = useCallback(async () => {
    setCreating(true);
    try {
      const r = await api<{ id: string }>("/api/documents", { method: "POST", json: {} });
      window.location.href = `/doc/${r.id}?new=1`;
    } catch {
      toast("Couldn't create the document. Try again.", "err");
      setCreating(false);
    }
  }, [toast]);

  const count = (n: number) => (state === "ready" ? <span className="count">{n}</span> : null);
  const nav = (href: string, label: string, icon: ReactNode, n: number) => (
    <Link href={href} className={path === href ? "on" : ""} aria-current={path === href ? "page" : undefined} onClick={() => setNavOpen(false)}>
      {icon}{label}{count(n)}
    </Link>
  );

  return (
    <ShellCtx.Provider value={{ newDocument, openImport: () => setImporting(true), creating }}>
      <div className={`app${navOpen ? " nav-open" : ""}`}>
        <aside className="sidebar" aria-label="Sidebar">
          <div className="brand"><Logo />DocSpace</div>
          <button type="button" className="btn btn-primary btn-block new" onClick={newDocument} disabled={creating}>
            {creating ? <Spinner /> : <Plus {...ICON} />}New document
          </button>
          <nav className="nav" aria-label="Documents">
            {nav("/", "My documents", <FileText {...ICON} />, owned.length)}
            {nav("/shared", "Shared with me", <Users {...ICON} />, shared.length)}
            <button type="button" onClick={() => { setNavOpen(false); setImporting(true); }}><Upload {...ICON} />Import file</button>
          </nav>
          <div className="spacer" />
          {me && (
            <button ref={acctRef} type="button" className="me" aria-haspopup="menu" aria-expanded={acctOpen} onClick={() => setAcctOpen((o) => !o)}>
              <Avatar user={me} size="md" />
              <div><b>{me.name}</b><span>{me.email}</span></div>
              <ChevronsUpDown {...ICON} className="chev" />
            </button>
          )}
          {acctOpen && me && (
            <AccountMenu anchor={acctRef} onClose={() => setAcctOpen(false)} me={me} up />
          )}
        </aside>
        <div className="scrim" onClick={() => setNavOpen(false)} />
        <main className="main">
          <div className="mobile-bar">
            <button type="button" className="icon-btn" aria-label="Open navigation" onClick={() => setNavOpen(true)}><MenuIcon {...ICON} /></button>
            <div className="brand"><Logo />DocSpace</div>
          </div>
          {children}
        </main>
      </div>
      {importing && <ImportDialog onClose={() => setImporting(false)} />}
    </ShellCtx.Provider>
  );
}
