# The security ledger: findings, fixes, and the standing rules

Security is never a one-time fix. This file is the living record an ACTIVE
security engineer would keep for DocSpace: every
finding with its state, every control verified sound (so the next audit does
not redo it), and the rules every future feature must obey. It evolves with
the code and with new research.

**Update when** a finding is fixed, accepted or found; a control is verified;
new security research or a provider advisory lands; or a feature adds a route,
input, upload, secret, permission or data path.

## The standing rules (bind every agent, every session)

1. **Every new feature obeys the rules below before it ships.** New route:
   server-side token verification and ownership derived on the server (never
   from the request body), a bounded body, registration in the API route
   allowlist, durable fail-closed quotas on anything paid or outbound. New
   table: row-level security scoped to the owner, plus every restrictive gate
   the other owner tables carry. New upload: server-side magic-byte sniff. New
   outbound fetch: public-URL check, DNS pre-flight, durable quota. Money and
   abuse gates run BEFORE paid model calls and fail closed. `SECURITY.md`
   describes the model; this file records the state.
2. **Found means fixed or recorded, never ignored.** An agent that finds a
   security gap fixes it in the same session when the fix is code it can
   test; it never waits to be asked. If the fix needs an owner decision, a
   paid upgrade, a sign-up or a credential, it goes to `LATER.md` with cost
   and impact, and the finding stays OPEN here until done.
3. **The loop runs it.** Every session reads this ledger after HANDOFF; a
   security session starts here and does not re-audit a row marked sound
   unless the code it names changed since the row's date
   (`git log -- <file>` decides).
4. **Research keeps it current.** Any session that touches auth, payments,
   uploads, row-level security or the AI boundary checks for new provider
   advisories (changelogs and CVEs of the providers in use) relevant to the
   touched area, and records what it checked. New attack classes against
   comparable apps get a row: does it apply here, and why not.
5. **Tell the owner straight** when security needs money, an account, or new
   research beyond a session's reach: what breaks, for whom, the fix, the
   cost. Never describe the login or anything else as unbreakable.
6. **Audits are claims until re-verified.** A pasted or prior-session report
   is re-checked against the current tree before acting; versions move fast.

## Findings

Severity at finding time. Status: FIXED (commit), OPEN, MITIGATED (partial,
follow-up listed), ACCEPTED (owner, dated), NEEDS_VALIDATION.

| ID | Finding | Sev | Status |
|---|---|---|---|
| SEC-001 | `public.handle_new_user()` (trigger, SECURITY DEFINER) was callable via `/rest/v1/rpc` by anon and authenticated (Supabase advisor 0028/0029). | Low | FIXED (migration harden_function_exposure) |
| SEC-002 | RLS helpers `doc_role` / `shares_a_doc_with` were exposed over REST in `public`; they only reveal the caller's own access, but are not API. | Low | FIXED (moved to schema `private`) |
| SEC-003 | Supabase Auth leaked-password protection is off (advisor). Demo accounts use a public password by design. | Low | ACCEPTED (assessment demo; enable for real users) |
| SEC-004 | Supabase public sign-up is enabled by default: anyone with the publishable key can call sign-up directly (email confirmation still required). The UI offers no sign-up. | Low | OPEN (disable sign-ups in Auth settings, or add a sign-up screen deliberately) |
| SEC-005 | Presence uses a public Realtime channel `doc:<uuid>`: someone who knows a document id and the publishable key could see who has it open (names only, no content). | Low | ACCEPTED (ids are random UUIDs; private channels with RLS on realtime.messages is the fix) |

### Accepted or tracked elsewhere (do not re-report)

| Item | Where |
|---|---|
| Demo accounts (`demo1234`) are shared by all reviewers; anyone can edit or delete demo data | README "Demo accounts" |

## Controls verified sound

A row here is skipped by later audits unless the named code changed since the
date. Say whether verification was source-level or live.

| Control | Where | Date |
|---|---|---|
| Every route derives the user from `auth.getUser()` (server-verified), never from the body | `src/lib/server/supabase.ts requireUser` | 2026-11-12, live (e2e: 401 without session) |
| Documents readable only by owner and shared users; anon reads nothing | RLS `documents_read`; `scripts/rls-check.ts` | 2026-11-12, live |
| Viewers cannot write; editors cannot delete, share or change `owner_id` | RLS + column grant `update(title, content)` | 2026-11-12, live |
| Shares written only through ownership-checked functions (direct insert revoked) | `share_document`, `update_share` | 2026-11-12, live |
| Upload: .txt/.md only, 1 MB cap (header and file), strict UTF-8, NUL bytes rejected, parsed to JSON (never HTML) | `src/app/api/documents/import/route.ts` | 2026-11-12, live |
| Stored content is editor JSON validated by shape and size; the editor renders through ProseMirror's schema (no raw HTML injection) | `isDocJSON`, DB check constraint | 2026-11-12, source |
| No server secret exists: the app uses only the publishable key; RLS is the boundary | `.env.example` | 2026-11-12, source |
| Login does not enumerate accounts (one message for unknown email and wrong password) | `api/auth/login` | 2026-11-12, live |
| Security headers: nosniff, frame DENY, referrer policy, permissions policy, HSTS | `next.config.ts` | 2026-11-12, live |

## Needs validation (the exact missing fact)

| What | How to get it |
|---|---|
| Content-Security-Policy | Add a nonce-based CSP via the proxy; test Tiptap and Supabase Realtime (wss) still work |

## Research log

| Date | What was checked | Result |
|---|---|---|
| 2026-11-12 | Supabase security advisor after the schema | 2 findings fixed (SEC-001, SEC-002), 1 accepted (SEC-003) |
| 2026-11-12 | `npm audit` on the pinned dependency set | 0 vulnerabilities (Next 16.4.6, Tiptap 3.33.1) |
