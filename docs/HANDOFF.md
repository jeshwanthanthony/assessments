# HANDOFF.md - where the last agent stopped, and what to do next

**Last updated:** 2026-11-12 by Claude (first release shipped and verified on production).
Where this file and Git disagree, Git wins: fix this file.

## 1. Where the work is

| Fact | Value (verified 2026-11-12) |
|---|---|
| Working branch | `main` (local repo; no remote yet) |
| Uncommitted changes | none after the release commit |
| Who commits here | Claude Code and the owner |

## 2. What is live

| Fact | Value |
|---|---|
| Host | Netlify site `docspace-ajaia`, https://docspace-ajaia.netlify.app |
| Database | Supabase project `docspace` (us-east-1), 3 migrations applied |
| Verified | e2e 40/40 and UI 21/21 against production; rls-check 22/22 |

## 3. What changed recently

- First release: all five core tasks, Viewer/Editor roles, presence, conflict-safe saving, Markdown/PDF export.

## 4. In flight

Nothing is in flight.

## 5. Open problems

- SEC-004 public sign-up enabled in Supabase Auth (docs/SECURITY_LEDGER.md).
- Unit test for the editor save queue (INVARIANTS 6).
- Content-Security-Policy (SECURITY_LEDGER "Needs validation").

## 6. Decisions that bind you

- Access is decided in the database (RLS, grants, owner-checked functions); routes never use a service key (docs/ARCHITECTURE.md).
- Content is stored as editor JSON, never HTML.
- The UI ports the approved preview CSS; docs/design/UI_SPEC.md wins over screenshots.

## 7. Traps that cost real time

- Netlify upload deploys need `@netlify/plugin-nextjs` declared (docs/MISTAKES.md).
- RLS policies that look up their own table need an `owner_id` shortcut for INSERT … RETURNING.

## 8. Exact next steps

1. Push to a Git remote and connect Netlify to it for deploy previews.
2. Close SEC-004 (disable sign-ups or build a sign-up screen).
3. Next stretch candidate: version history (`document_versions` written on save).
