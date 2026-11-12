"use client";
import {
  createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState,
  type ReactNode, type RefObject,
} from "react";
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { initials } from "@/lib/core/doc";

export const ICON = { size: 16, strokeWidth: 1.75 } as const;
export const ICON_SM = { size: 14, strokeWidth: 1.75 } as const;
export const ICON_LG = { size: 20, strokeWidth: 1.75 } as const;

export type Person = { id: string; name: string; email: string; color: string };

export function Avatar({ user, size = "" }: { user: Pick<Person, "name" | "color">; size?: "" | "md" | "lg" }) {
  return (
    <span className={`av ${size}`} style={{ background: user.color }} title={user.name} aria-hidden="true">
      {initials(user.name)}
    </span>
  );
}

export function Spinner({ sm }: { sm?: boolean }) {
  return <Loader2 {...(sm ? ICON_SM : ICON)} className="spin" aria-hidden="true" />;
}

export function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <rect width="22" height="22" rx="6" fill="#18181b" />
      <path d="M7 5.5h5.2a4.8 4.8 0 0 1 0 9.6H7z" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M7 16.5h8" stroke="#3451d1" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// ---------- tooltip ----------

export function Tip({ label, kbd, children }: { label: string; kbd?: string; children: (p: TipProps) => ReactNode }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = (el: HTMLElement) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (document.querySelector(".menu")) return; // never over an open menu
      const r = el.getBoundingClientRect();
      setPos({ x: r.left + r.width / 2, y: r.bottom + 6 });
    }, 300);
  };
  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setPos(null);
  };
  return (
    <>
      {children({
        onMouseEnter: (e) => show(e.currentTarget),
        onMouseLeave: hide,
        onFocus: (e) => e.currentTarget.matches(":focus-visible") && show(e.currentTarget),
        onBlur: hide,
        onMouseDown: hide,
      })}
      {pos && (
        <TipBubble x={pos.x} y={pos.y}>
          {label}
          {kbd && <kbd>{kbd}</kbd>}
        </TipBubble>
      )}
    </>
  );
}
type TipProps = {
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave: () => void;
  onFocus: (e: React.FocusEvent<HTMLElement>) => void;
  onBlur: () => void;
  onMouseDown: () => void;
};
function TipBubble({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(x);
  useLayoutEffect(() => {
    const w = ref.current?.offsetWidth ?? 0;
    setLeft(Math.max(8, Math.min(window.innerWidth - w - 8, x - w / 2)));
  }, [x]);
  return <div ref={ref} className="tip" role="tooltip" style={{ left, top: y }}>{children}</div>;
}

// ---------- menu ----------

export function Menu({
  anchor, onClose, children, align = "start", up = false, label,
}: {
  anchor: RefObject<HTMLElement | null>; onClose: () => void; children: ReactNode;
  align?: "start" | "end"; up?: boolean; label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: "hidden" });
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    // Re-place whenever the menu changes size (e.g. a list that loads after opening), always inside the viewport.
    const place = () => {
      const r = anchor.current?.getBoundingClientRect();
      if (!r) return;
      const w = m.offsetWidth, h = m.offsetHeight;
      let left = align === "end" ? r.right - w : r.left;
      left = Math.max(8, Math.min(window.innerWidth - w - 8, left));
      let top = up ? r.top - h - 4 : r.bottom + 4;
      if (!up && top + h > window.innerHeight - 8) top = r.top - h - 4;
      top = Math.max(8, Math.min(window.innerHeight - h - 8, top));
      setStyle({ left, top, maxHeight: window.innerHeight - 16, overflowY: "auto" });
    };
    place();
    m.querySelector<HTMLButtonElement>("button:not([disabled])")?.focus();
    const ro = new ResizeObserver(place);
    ro.observe(m);
    return () => ro.disconnect();
  }, [anchor, align, up]);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node) && !anchor.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      const items = [...(ref.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") ?? [])];
      const i = items.indexOf(document.activeElement as HTMLButtonElement);
      if (e.key === "Escape") { e.preventDefault(); onClose(); anchor.current?.focus(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length]?.focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length]?.focus(); }
      else if (e.key === "Tab") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [anchor, onClose]);
  return <div ref={ref} className="menu" role="menu" aria-label={label} style={style}>{children}</div>;
}

export function MenuItem({ icon, children, onSelect, right, className, disabled }: {
  icon?: ReactNode; children: ReactNode; onSelect: () => void; right?: ReactNode; className?: string; disabled?: boolean;
}) {
  return (
    <button type="button" role="menuitem" className={className} onClick={onSelect} disabled={disabled}>
      {icon}
      {children}
      {right}
    </button>
  );
}

// ---------- dialog ----------

export function Dialog({ title, sub, onClose, children, footer, labelId }: {
  title: ReactNode; sub?: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode; labelId: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current!;
    (el.querySelector<HTMLElement>("[autofocus], input, button.drop, button:not(.icon-btn)") ?? el).focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      if (e.key !== "Tab") return;
      const f = [...el.querySelectorAll<HTMLElement>("button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex='0']")];
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className="dialog" role="dialog" aria-modal="true" aria-labelledby={labelId} tabIndex={-1}>
        <div className="dlg-h">
          <div style={{ minWidth: 0 }}>
            <h2 id={labelId}>{title}</h2>
            {sub && <p>{sub}</p>}
          </div>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><X {...ICON} /></button>
        </div>
        <div className="dlg-b">{children}</div>
        {footer && <div className="dlg-f">{footer}</div>}
      </div>
    </div>
  );
}

// ---------- toasts ----------

type Toast = { id: number; msg: string; kind: "ok" | "err" };
const ToastCtx = createContext<(msg: string, kind?: "ok" | "err") => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const push = useCallback((msg: string, kind: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setList((l) => [...l, { id, msg, kind }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        {list.map((t) => (
          <div key={t.id} className={`toast${t.kind === "err" ? " err" : ""}`} role="status">
            <span className="ti">{t.kind === "err" ? <AlertCircle {...ICON} /> : <CheckCircle2 {...ICON} />}</span>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ---------- fetch helper ----------

export class ApiFailure extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

// ---------- session identity (one account per browser; tabs must agree) ----------

// Each TAB uses one account (several can be signed in on the browser). The choice lives in sessionStorage,
// which is per tab, and every API call names it in x-docspace-user; the server acts as that account.
const TAB_KEY = "ds-tab-account";
let expectedUser: string | null = null;
try { expectedUser = typeof window !== "undefined" ? window.sessionStorage.getItem(TAB_KEY) : null; } catch { /* storage blocked */ }
/** Pins this tab to an account (null: follow the browser default account). */
export function setExpectedUser(id: string | null) {
  expectedUser = id;
  try { if (id) window.sessionStorage.setItem(TAB_KEY, id); else window.sessionStorage.removeItem(TAB_KEY); } catch { /* storage blocked */ }
}
export const tabAccount = () => expectedUser;

const AUTH_CHANNEL = "docspace-auth";
/** Tell the other open tabs that the account changed (sign-in, sign-up, switch, sign-out, delete). */
export function announceAuthChange() {
  try { new BroadcastChannel(AUTH_CHANNEL).postMessage("changed"); } catch { /* old browser: the server guard still protects */ }
}
/** Run when another tab signs an account in or out (each tab then re-checks that its own account is still signed in). */
export function onAuthChange(fn: () => void): () => void {
  try {
    const ch = new BroadcastChannel(AUTH_CHANNEL);
    ch.onmessage = () => fn();
    return () => ch.close();
  } catch { return () => {}; }
}

export async function api<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  let res: Response;
  const h = new Headers(rest.headers);
  if (json !== undefined) h.set("content-type", "application/json");
  if (expectedUser && !path.startsWith("/api/auth")) h.set("x-docspace-user", expectedUser);
  try {
    res = await fetch(path, {
      ...rest,
      headers: h,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new ApiFailure(0, "network", "Check your connection and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined" && !path.startsWith("/api/auth")) window.location.href = "/login";
    if (data?.error?.code === "session_changed" && typeof window !== "undefined") {
      // This tab's account was signed out elsewhere: fall back to the browser's default account.
      setExpectedUser(null);
      window.location.href = "/";
    }
    throw new ApiFailure(res.status, data?.error?.code ?? "error", data?.error?.message ?? "Something went wrong.");
  }
  return data as T;
}
