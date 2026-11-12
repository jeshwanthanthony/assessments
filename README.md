# DocSpace

A lightweight collaborative document editor: create, format, import, share and reopen documents.
Built for the Ajaia AI-Native Full Stack Developer assignment.

**Live app:** https://docspace-ajaia.netlify.app

## Try it in two minutes

1. Open the live app and click **Maya Chen** under "Demo accounts for reviewers" (password `demo1234`).
2. **New document**: type, then use the toolbar (or ⌘/Ctrl+B, I, U, ⌘⌥1-3 for headings, ⌘⇧7/8 for lists).
   Watch the status go *Unsaved changes* → *Saving…* → *Saved*. Reload: everything is still there.
3. **Share** → type `daniel@docspace.dev` → choose Editor or Viewer → Share.
4. Account menu (bottom left) → **Switch demo account** → Daniel. The document is under **Shared with me**.
   Open it in two windows (Maya in one, Daniel in a private window) to see the presence avatars.
5. **Import** a `.txt` or `.md` file (max 1 MB): it becomes a new editable document.
6. In the editor, the download icon exports **Markdown** or **Print / save as PDF**.

| Demo account | Password | Notes |
|---|---|---|
| maya@docspace.dev | demo1234 | Owns 3 docs, has 2 shared with her |
| daniel@docspace.dev | demo1234 | Owns 2 docs, has 2 shared with him |
| priya@docspace.dev | demo1234 | Share target; owns one doc shared with both |

Demo accounts are shared by every reviewer, so data may change while you look.

## What is built

| Requirement | Implementation |
|---|---|
| Create, rename, edit, save, reopen | Dashboard and editor; title edit in place (editor or row menu); 800 ms debounced autosave; reopen from either list |
| Rich text | Tiptap: bold, italic, underline, H1-H3, bulleted and numbered lists, undo/redo, keyboard shortcuts, active-state toolbar |
| File upload | **.txt and .md only, up to 1 MB** → a new document. Text: each line is a paragraph. Markdown: headings, lists, bold, italic and `<u>` are kept. Checked in the browser and again on the server (type, size, UTF-8, no binary). |
| Sharing | Owner shares by email as **Editor** or **Viewer**, can change a role or remove access. Owned and shared documents are separate lists with distinct icons; the editor shows "Owned by …" and a View-only pill. |
| Persistence | Supabase Postgres. Content is stored as editor JSON (lossless structure and formatting); access is enforced by row-level security in the database, not only in the API. |
| Validation and errors | Every state in the spec: login errors, list loading/empty/error, save error with Retry, share errors (invalid email, unknown user, already shared, owner's own email), import errors, not-found document |
| Tests | Unit tests, a live access-control test, an API end-to-end test and a browser test (below) |

**Stretch features** (after the core was done and verified):
- **Role-based sharing:** Viewer vs Editor, enforced by RLS and column grants.
- **Real-time collaboration indicators:** avatars of who else has the document open (Supabase Realtime presence). When another person saves and you have no unsaved changes, your view refreshes.
- **Conflict-safe saving:** a save made against an old version gets a 409. You choose "Load theirs" or "Keep mine" instead of silently overwriting.
- **Export:** Markdown download and print-to-PDF.

**Deliberately not built:** simultaneous co-editing (CRDT/OT), comments, version history, sign-up and password reset (seeded accounts are enough for this scope), .docx import. The reasons are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Run locally

Requires Node 20.19+ or 22.13+.

```bash
npm install
cp .env.example .env.local      # fill in your Supabase URL and publishable key
npm run dev                     # http://localhost:3000
```

Using the existing hosted database, `.env.local` needs only the two public values that `.env.example` names. They are public by design: RLS protects the data.

To use **your own Supabase project**:
1. Run `supabase/migrations/20261112125722_docspace_schema.sql` in the SQL editor.
2. Run `scripts/seed-users.sql` (creates the three demo accounts).
3. Run `npm run seed` (creates the six demo documents and their shares, signing in as each user).

## Tests

| Command | What it proves | Needs |
|---|---|---|
| `npm test` | 12 unit tests: txt/Markdown import, Markdown export round-trip, title/email/file validation, share status → HTTP code and UI copy | nothing (offline) |
| `npm run test:rls` | 22 checks against the real database: anon sees nothing, outsiders see nothing, viewers cannot write, editors cannot delete/share/take ownership, shares only via owner functions, stale writes match nothing | `.env.local` |
| `npm run test:e2e` | 40 checks of the five core tasks over HTTP as two users: create, rename, rich save and reopen, conflict, sharing rules, imports and their rejections, sign out | a running app (`BASE=…`, default `http://localhost:3000`) |
| `npm run test:ui` | 21 checks in headless Chromium at desktop and phone sizes: login, lists, search, create, format, autosave, reload persistence, share dialog, import dialog, a second user, presence, no horizontal scroll on phone | a running app; `npx playwright install chromium` once |
| `npm run typecheck`, `npm run build` | types and production build | nothing |

All suites pass locally and against production (2026-11-12).

## Project layout

```
src/app/            routes: /login, / (My documents), /shared, /doc/[id], /api/*
src/components/     AppShell, DocumentList, Editor, ShareDialog, ImportDialog, ui (menu, dialog, toast, tooltip)
src/lib/core/       pure logic, no I/O: import/export, validation, share outcomes (unit tested)
src/lib/server/     Supabase client acting as the user, named data-access functions
supabase/migrations the schema, RLS and share functions
scripts/            seed, rls-check, e2e-api, e2e-ui
docs/               architecture note, AI workflow note, engineering playbook, design handoff
```

## Further reading

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): the architecture, what was prioritized and why
- [docs/AI_WORKFLOW.md](docs/AI_WORKFLOW.md): how AI tools were used, what was changed or rejected, how correctness was verified
- [docs/design/UI_SPEC.md](docs/design/UI_SPEC.md): the approved UI spec the app follows
