# HANDOFF.md - where the last agent stopped, and what to do next

**Last updated:** 2026-11-12 by Claude (first release shipped and verified on production).
Where this file and Git disagree, Git wins: fix this file.

## 1. Where the work is

| Fact | Value (verified 2026-11-12) |
|---|---|
| Working branch | `main`, pushed to github.com/jeshwanthanthony/assessments |
| Uncommitted changes | none after the release commit |
| Who commits here | Claude Code and the owner |

## 2. What is live

| Fact | Value |
|---|---|
| Host | Netlify site `docspace-ajaia`, https://docspace-ajaia.netlify.app |
| Database | Supabase project `docspace` (us-east-1), 5 migrations applied |
| Verified | unit 16/16, rls-check 32/32 (live DB), e2e 89/89 and UI 42/42 against production (2026-11-12) |

## 3. What changed recently

- Several accounts per browser, one per tab (server-held sessions, x-docspace-user); Delete account; fixed the stale-tab bug (docs/MISTAKES.md); no "demo" wording in the UI.
- Sign-up with password policy; comments (threads, resolve); version history (preview, restore); Commenter role.
- Original brief, full UI handoff and playbook preserved unmodified in docs/reference/.
- First release: all five core tasks, roles, presence, conflict-safe saving, Markdown/PDF export.

## 4. In flight

Nothing is in flight.

## 5. Open problems

- SEC-006 sign-up does not verify email ownership (accepted for the demo); SEC-004 native Supabase sign-up still enabled.
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

1. Connect Netlify to the GitHub repo for deploy previews.
2. In Supabase Auth settings: disable native sign-ups (SEC-004) and turn on email confirmation, then switch /api/auth/signup to auth.signUp (SEC-006).
3. Next candidate: suggestion mode, or email verification + password reset.
