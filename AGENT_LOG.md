# AGENT_LOG.md (newest first)

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
