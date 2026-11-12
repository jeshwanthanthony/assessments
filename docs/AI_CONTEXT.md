# AI_CONTEXT.md - the stable facts an agent needs in two minutes

What changes daily is in `docs/HANDOFF.md`. Diagrams and flows are in `docs/ARCHITECTURE.md`; this is the short version with the traps.

## What this is

DocSpace: a lightweight collaborative document editor built for the Ajaia assessment. People sign up or use a sample account, create and format documents, import .txt/.md, share by email as Editor, Commenter or Viewer, comment, restore versions, and see each other's cursors live. Several accounts can be signed in at once, one per tab.

## Stack and runtime

- **App:** Next.js 16 (App Router, TypeScript) on Netlify, using `@netlify/plugin-nextjs`. `src/proxy.ts` handles page routing.
- **Supabase project `docspace`:** auth (ES256 tokens), Postgres with RLS, and Realtime. The app holds only the publishable key; there is no server secret.
- **Editor:** Tiptap 3, with a reduced StarterKit, a placeholder, and the remote-cursor plugin.

## Repository layout

| Path | What |
|---|---|
| `src/app/api/` | API routes. Every one starts with `requireUser()`, which picks the tab's account and verifies its token. |
| `src/lib/server/` | `supabase.ts` (client, `requireUser`), `accounts.ts` (several accounts per browser), `documents.ts` (named data access) |
| `src/lib/core/` | Pure logic, unit tested: import/export, validation, password policy, roles |
| `src/components/` | AppShell, DocumentList, Editor, DocPanel, dialogs, AccountMenu, realtime, remoteCursors, ui |
| `supabase/migrations/` | Every migration, exactly as applied to the live project |
| `scripts/` | seed, rls-check, e2e-api, e2e-ui, perf-share |
| `docs/reference/` | The original brief, UI handoff and playbook. Never edit these. |

## Trust boundaries

- **Identity:** the server decides who is acting, from the verified token of the tab's account. It never trusts the request body.
- **Database:** RLS, column grants and owner-checked functions decide every read and write.
- **Realtime:** channels carry names, colours and cursor positions only, never content.

## How work ships

`docs/DEPLOYMENT.md`, "DocSpace specifics". In short: typecheck, unit tests, build, rls-check, e2e and UI against `next start`, deploy through the Netlify MCP, then e2e and UI against production. Migrations are applied by hand first and recorded in `supabase/migrations/`.
