// Password policy, shared by the sign-up form (live checklist), the API and the tests.
// The database function public.sign_up enforces the same rules again.

export const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 && p.length <= 72 },
  { id: "upper", label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { id: "number", label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { id: "symbol", label: "One symbol (e.g. ! @ # $)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

export function passwordProblems(p: string): string[] {
  return PASSWORD_RULES.filter((r) => !r.test(p)).map((r) => r.label);
}

export const isStrongPassword = (p: string) => passwordProblems(p).length === 0;

export function normalizeName(raw: unknown): string {
  return typeof raw === "string" ? raw.replace(/\s+/g, " ").trim().slice(0, 80) : "";
}

export type SignUpStatus = "ok" | "invalid_email" | "invalid_name" | "weak_password" | "email_taken" | "rate_limited";

export function signUpOutcome(s: SignUpStatus): { http: number; message: string } {
  switch (s) {
    case "ok": return { http: 201, message: "Account created." };
    case "invalid_email": return { http: 400, message: "Enter a valid email address." };
    case "invalid_name": return { http: 400, message: "Enter your name." };
    case "weak_password": return { http: 400, message: "Your password doesn't meet the requirements below." };
    case "email_taken": return { http: 409, message: "An account with this email already exists. Sign in instead." };
    case "rate_limited": return { http: 429, message: "Too many new accounts right now. Try again in a few minutes." };
  }
}
