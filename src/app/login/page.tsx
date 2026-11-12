"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { AlertCircle, ArrowUpRight } from "lucide-react";
import { api, ApiFailure, Avatar, ICON, Logo, Spinner } from "@/components/ui";
import { DEMO_PASSWORD, DEMO_USERS } from "@/lib/core/demo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function signIn(e: string, p: string) {
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/login", { method: "POST", json: { email: e, password: p } });
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  return (
    <main className="login">
      <div className="login-card">
        <div className="brand"><Logo />DocSpace</div>
        <h1>Sign in to DocSpace</h1>
        <p className="sub">Write, share and import documents.</p>
        <form ref={formRef} noValidate onSubmit={(ev) => { ev.preventDefault(); if (!busy) signIn(email, password); }}>
          {error && (
            <div className="alert danger" role="alert"><AlertCircle {...ICON} /><span>{error}</span></div>
          )}
          <div className="field">
            <label className="label" htmlFor="email">Email</label>
            <input id="email" className={`input${error ? " err" : ""}`} type="email" autoComplete="email" autoFocus
              value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </div>
          <div className="field">
            <label className="label" htmlFor="pw">Password</label>
            <input id="pw" className={`input${error ? " err" : ""}`} type="password" autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy}>
            {busy ? <><Spinner />Signing in…</> : "Sign in"}
          </button>
        </form>
        <p className="foot" style={{ marginTop: 14 }}>New to DocSpace? <Link href="/signup" className="link">Create an account</Link></p>
        <div className="divider">Demo accounts for reviewers</div>
        <div className="demo-accts">
          {DEMO_USERS.map((u) => (
            <button key={u.email} type="button" className="demo-acct" disabled={busy}
              onClick={() => { setEmail(u.email); setPassword(DEMO_PASSWORD); signIn(u.email, DEMO_PASSWORD); }}>
              <Avatar user={u} size="md" />
              <div><b>{u.name}</b><span>{u.email} · {DEMO_PASSWORD}</span></div>
              <ArrowUpRight {...ICON} className="go" />
            </button>
          ))}
        </div>
        <p className="foot">Demo accounts are shared by all reviewers. A third account, priya@docspace.dev, can be shared with.</p>
      </div>
    </main>
  );
}
