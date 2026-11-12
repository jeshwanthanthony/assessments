# AGENT_LOG.md (newest first)

## 2026-11-12 Docs system completed (Claude)
- Added the docs the agent contract points to but were missing: AI_CONTEXT, DECISIONS (15 decisions, who made each), SCALING (8 weak points, estimates). HANDOFF rewritten as a full snapshot. MISTAKES gained 4 real entries that had not been logged, plus an index.

## 2026-11-12 Live cursors, instant shares, faster checks (Claude)
- Owner asked for cursors of two users at once and faster sharing. Remote cursors as ProseMirror decorations over Realtime; inbox channel per user; getClaims instead of getUser.
- Measured with scripts/perf-share.ts: share 107-112 ms warm (was 129-262 ms). Found and fixed a regression in account deletion (MISTAKES).
- Verified on production: unit 16, rls 32, e2e 89, UI 47.

## 2026-11-12 GitHub (Claude)
- Repo jeshwanthanthony/assessments (private: creating a public repo was blocked by the permission check; owner to flip). Commit trailers removed so the owner is sole author. Short README, full guide in docs/GUIDE.md.

## 2026-11-12 Multi-account per tab, delete account (Claude)
- Owner-reported: sharing "failed" for a new account. Cause: another tab signed in as a different account, so this tab acted as that account. Fix: per-tab accounts with a server check (see MISTAKES).
- Verified: unit 16, rls 32, e2e 89, UI 42, all on production. Export button now labelled.

## 2026-11-12 Accounts, comments, versions, roles (Claude)
- What: /signup with password policy (UI, API and DB), Commenter role, comment threads, version history with restore, reference docs preserved.
- Verified: unit 16/16, rls-check 32/32, e2e 62/62 and UI 31/31 on production.
- Lessons: host badge overlap, stale test server, test selection input (docs/MISTAKES.md).

## 2026-11-12 First release (Claude)
- What: DocSpace v1 on Next.js 16 + Supabase + Tiptap, deployed to Netlify.
- Why: Ajaia assessment; scope and cuts in docs/ARCHITECTURE.md.
- Verified: unit 12/12, rls-check 22/22, e2e 40/40 and UI 21/21 locally and on production.
- Lessons: docs/MISTAKES.md (5 entries).
