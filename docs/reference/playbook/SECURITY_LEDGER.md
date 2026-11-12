# The security ledger: findings, fixes, and the standing rules

Security is never a one-time fix. This file is the living record an ACTIVE
security engineer would keep for AI Native Full Stack Assignment: every
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
| SEC-001 | (example) What an attacker can do, from where, and the code path. | Low | OPEN |

### Accepted or tracked elsewhere (do not re-report)

| Item | Where |
|---|---|

## Controls verified sound

A row here is skipped by later audits unless the named code changed since the
date. Say whether verification was source-level or live.

| Control | Where | Date |
|---|---|---|

## Needs validation (the exact missing fact)

| What | How to get it |
|---|---|

## Research log

| Date | What was checked | Result |
|---|---|---|
