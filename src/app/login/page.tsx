"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, ArrowUpRight } from "lucide-react";
import { announceAuthChange, api, ApiFailure, setExpectedUser, Avatar, ICON, Logo, Spinner } from "@/components/ui";
import { SAMPLE_PASSWORD, SAMPLE_USERS } from "@/lib/core/demo";
import type { Profile } from "@/lib/core/types";

type Accounts = { accounts: Profile[]; defaultAccount: string | null };

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [accounts, setAccounts] = useState<Accounts | null>(null);

  useEffect(() => {
    setAdding(new URLSearchParams(window.location.search).has("add"));
    api<Accounts>("/api/auth/accounts").then(setAccounts).catch(() => setAccounts({ accounts: [], defaultAccount: null }));
  }, []);

  const done = () => { setExpectedUser(null); announceAuthChange(); window.location.href = "/"; };

  async function signIn(e: string, p: string, key = "form") {
    setBusy(key);
    setError(null);
    try {
      await api("/api/auth/login", { method: "POST", json: { email: e, password: p } });
      done();
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "Something went wrong. Try again.");
      setBusy(null);
    }
  }

  async function switchTo(a: Profile) {
    setBusy(a.id);
    setError(null);
    try {
      await api("/api/auth/switch", { method: "POST", json: { userId: a.id } });
      done();
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "Couldn't switch accounts.");
      setAccounts((x) => (x ? { ...x, accounts: x.accounts.filter((o) => o.id !== a.id) } : x));
      setBusy(null);
    }
  }

  const signedIn = accounts?.accounts ?? [];
  const choose = signedIn.filter((a) => a.id !== accounts?.defaultAccount);
  const samples = SAMPLE_USERS.filter((u) => !signedIn.some((a) => a.email === u.email));
  return (
    <main className="login">
      <div className="login-card">
        <div className="brand"><Logo />DocSpace</div>
        <h1>{adding ? "Add another account" : "Sign in to DocSpace"}</h1>
        <p className="sub">{adding ? "You'll stay signed in to your other accounts." : "Write, share and import documents."}</p>

        {!adding && choose.length > 0 && (
          <>
            <div className="divider">Choose an account</div>
            <div className="demo-accts" style={{ marginBottom: 20 }}>
              {choose.map((a) => (
                <button key={a.id} type="button" className="demo-acct" disabled={!!busy} onClick={() => switchTo(a)}>
                  <Avatar user={a} size="md" />
                  <div><b>{a.name}</b><span>{a.email}</span></div>
                  {busy === a.id ? <Spinner /> : <ArrowUpRight {...ICON} className="go" />}
                </button>
              ))}
            </div>
            <div className="divider">Or sign in with another account</div>
          </>
        )}

        <form noValidate onSubmit={(ev) => { ev.preventDefault(); if (!busy) signIn(email, password); }}>
          {error && <div className="alert danger" role="alert"><AlertCircle {...ICON} /><span>{error}</span></div>}
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
          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={!!busy}>
            {busy === "form" ? <><Spinner />Signing in…</> : "Sign in"}
          </button>
        </form>
        <p className="foot" style={{ marginTop: 14 }}>
          New to DocSpace? <Link href={adding ? "/signup?add=1" : "/signup"} className="link">Create an account</Link>
        </p>
        {adding && (
          <p className="foot" style={{ marginTop: 6 }}>
            <Link href="/" className="link"><ArrowLeft size={12} style={{ verticalAlign: -1 }} /> Back to my documents</Link>
          </p>
        )}

        {samples.length > 0 && (
          <>
            <div className="divider">Sample accounts</div>
            <div className="demo-accts">
              {samples.map((u) => (
                <button key={u.email} type="button" className="demo-acct" disabled={!!busy}
                  onClick={() => { setEmail(u.email); setPassword(SAMPLE_PASSWORD); signIn(u.email, SAMPLE_PASSWORD, u.email); }}>
                  <Avatar user={u} size="md" />
                  <div><b>{u.name}</b><span>{u.email} · {SAMPLE_PASSWORD}</span></div>
                  {busy === u.email ? <Spinner /> : <ArrowUpRight {...ICON} className="go" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
