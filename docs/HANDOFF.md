# HANDOFF.md - where the last agent stopped, and what to do next

**Last updated:** 2026-11-12 by Claude (after the live-cursors and faster-sharing release; repo pushed to GitHub).
Sections 1 and 2 were verified against Git, Netlify and Supabase at that time. Where this file and Git disagree, Git wins: fix this file.

Read it right after `AGENTS.md`, then `docs/AI_CONTEXT.md`. It is a snapshot, not a diary: history is in `AGENT_LOG.md`.

## 1. Where the work is

| Fact | Value (verified 2026-11-12) |
|---|---|
| Working branch | `main`, tracking `origin/main` at github.com/jeshwanthanthony/assessments (private) |
| Uncommitted changes | none |
| Other branches | none |
| Stashes | none |
| Who commits here | the owner (sole author); Claude Code works in the owner's session |

## 2. What is live

| Fact | Value |
|---|---|
| App | Netlify site `docspace-ajaia`, https://docspace-ajaia.netlify.app (deploy `6af5d3107b0598a98516ccb0`) |
| Database | Supabase project `docspace` (us-east-1), 5 migrations applied, all recorded in `supabase/migrations/` |
| Verified on production | unit 16/16, rls-check 32/32, e2e 89/89, UI 47/47; share about 110 ms warm (`npm run perf:share`) |

## 3. What changed recently (last five)

1. Live cursors (named, coloured carets and selections), instant "shared with you", local session verification (ES256).
2. GitHub repo created; short README; full guide moved to `docs/GUIDE.md`.
3. Several accounts per browser with one per tab; Delete account; fix for the owner-reported stale-tab share failure.
4. Sign-up with password policy; comments; version history; Commenter role; reference originals preserved.
5. First release: five core tasks, roles, presence, conflict-safe saving, export.

## 4. In flight

Nothing is in flight.

## 5. Open problems (each has its home)

| Problem | Where |
|---|---|
| Repo is private; reviewers need it public (owner decision, one command) | `gh repo edit jeshwanthanthony/assessments --visibility public --accept-visibility-change-consequences` |
| Sign-up skips email verification; native Supabase sign-up still enabled | `docs/SECURITY_LEDGER.md` SEC-004, SEC-006 |
| Browser tests leave documents behind when a run aborts midway | `docs/MISTAKES.md` MINE-2026-11-12-aborted-tests-leave-data |
| No unit test for the editor save queue | `docs/INVARIANTS.md` 6 |
| No Content-Security-Policy yet | `docs/SECURITY_LEDGER.md` "Needs validation" |
| Weak points under many users | `docs/SCALING.md` |

## 6. Decisions that bind you

Read `docs/DECISIONS.md` before changing any of these: access lives in the database (no service key); content is editor JSON; the UI ports the approved preview CSS; one account per tab via `x-docspace-user`; session tokens verified locally.

## 7. Traps that cost real time (each one happened)

- Netlify upload deploys need `@netlify/plugin-nextjs` declared, or every route is a 404.
- The Netlify deploy command embeds a short-lived token: ask the MCP tool for a fresh one per deploy.
- A server still on port 3000 serves the old build: stop it (PowerShell `Get-NetTCPConnection -LocalPort 3000`) before testing a new build.
- Do not write TypeScript with template strings through shell heredocs or `node -e`: backticks get eaten. Use the editor tool.
- Netlify injects a badge in the bottom-right corner on production only: keep controls out of it.

## 8. Exact next steps

0. Section 4 says nothing is in flight.
1. Read `AGENTS.md`, this file, `docs/AI_CONTEXT.md`, then `git status` and `git log --oneline -8`.
2. Owner: make the repo public when ready to submit.
3. Make `scripts/e2e-ui.ts` clean up in a `finally` block (see the mistakes entry), then remove the manual SQL cleanup step.
4. Close SEC-004/SEC-006: turn on email confirmation in Supabase Auth, switch `/api/auth/signup` to `auth.signUp`, disable the native sign-up path.
5. Before any deploy: `npm run typecheck && npm test && npm run build`, `npm run test:rls`, then e2e and UI against `next start`, deploy, and the same two suites against production (`docs/DEPLOYMENT.md`).

## Update rules for this file

Keep it under about 200 lines; rewrite sections in place; re-verify sections 1 and 2 on every update; never write secret values, customer data or user content here.
