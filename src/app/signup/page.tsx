"use client";
import Link from "next/link";
import { useState } from "react";
import { AlertCircle, Check, Circle, Eye, EyeOff } from "lucide-react";
import { api, ApiFailure, ICON, ICON_SM, Logo, Spinner } from "@/components/ui";
import { isStrongPassword, PASSWORD_RULES } from "@/lib/core/auth";
import { isValidEmail } from "@/lib/core/doc";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);

  const errs = {
    name: !name.trim() ? "Enter your name." : null,
    email: !isValidEmail(email) ? "Enter a valid email address." : null,
    password: !isStrongPassword(password) ? "Your password doesn't meet every requirement." : null,
    confirm: confirm !== password ? "Passwords don't match." : null,
  };
  const valid = !Object.values(errs).some(Boolean);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/signup", { method: "POST", json: { name, email, password } });
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  const fieldErr = (k: keyof typeof errs) => tried && errs[k];
  return (
    <main className="login">
      <div className="login-card">
        <div className="brand"><Logo />DocSpace</div>
        <h1>Create your account</h1>
        <p className="sub">Write, share and import documents.</p>
        <form noValidate onSubmit={submit}>
          {error && <div className="alert danger" role="alert"><AlertCircle {...ICON} /><span>{error}</span></div>}
          <div className="field">
            <label className="label" htmlFor="name">Name</label>
            <input id="name" className={`input${fieldErr("name") ? " err" : ""}`} autoComplete="name" autoFocus maxLength={80}
              value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Morgan" />
            {fieldErr("name") && <p className="help err"><AlertCircle {...ICON_SM} />{errs.name}</p>}
          </div>
          <div className="field">
            <label className="label" htmlFor="email">Email</label>
            <input id="email" className={`input${fieldErr("email") ? " err" : ""}`} type="email" autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            {fieldErr("email") && <p className="help err"><AlertCircle {...ICON_SM} />{errs.email}</p>}
          </div>
          <div className="field">
            <label className="label" htmlFor="pw">Password</label>
            <div className="pw-wrap">
              <input id="pw" className={`input${fieldErr("password") ? " err" : ""}`} type={show ? "text" : "password"}
                autoComplete="new-password" maxLength={72} aria-describedby="pw-rules"
                value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className="icon-btn" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((s) => !s)}>
                {show ? <EyeOff {...ICON} /> : <Eye {...ICON} />}
              </button>
            </div>
            <ul className="pw-rules" id="pw-rules" aria-live="polite">
              {PASSWORD_RULES.map((r) => {
                const ok = r.test(password);
                return (
                  <li key={r.id} className={ok ? "ok" : tried ? "bad" : ""}>
                    {ok ? <Check {...ICON_SM} /> : <Circle {...ICON_SM} />}{r.label}
                    <span className="sr">{ok ? " (met)" : " (not met)"}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="field">
            <label className="label" htmlFor="pw2">Confirm password</label>
            <input id="pw2" className={`input${fieldErr("confirm") ? " err" : ""}`} type={show ? "text" : "password"}
              autoComplete="new-password" maxLength={72} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            {fieldErr("confirm") && <p className="help err"><AlertCircle {...ICON_SM} />{errs.confirm}</p>}
          </div>
          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy}>
            {busy ? <><Spinner />Creating account…</> : "Create account"}
          </button>
        </form>
        <p className="foot">Already have an account? <Link href="/login" className="link">Sign in</Link></p>
      </div>
    </main>
  );
}
