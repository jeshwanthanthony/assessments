# DocSpace: full guide

A lightweight collaborative document editor: create, format, import, share, comment on and reopen documents.
Built for the Ajaia AI-Native Full Stack Developer assignment ([original brief](reference/ASSESSMENT.md)).

**Live app:** https://docspace-ajaia.netlify.app

## Try it in two minutes

1. Open the live app. Either **Create an account** (password: 8+ characters with an uppercase letter, a lowercase letter, a number and a symbol) or click a sample account.
2. **New document**: type, then format with the toolbar (or Ctrl/⌘+B, I, U; Ctrl/⌘+Alt+1-3 for headings; Ctrl/⌘+Shift+7/8 for lists).
   The status goes *Unsaved changes* → *Saving…* → *Saved*. Reload: everything is still there.
3. **Share** → type `daniel@docspace.dev` → choose **Editor**, **Commenter** or **Viewer**.
4. Select text → the comment icon → write a comment. Reply to it, or resolve it, from the Comments panel.
5. The **history** icon lists versions (one per person's editing session). Preview one, then **Restore**.
6. **Two accounts side by side:** account menu (bottom left) → **Add another account** → sign in. Each tab keeps its own account, so open the same document in two tabs as two people and each sees the other in the top bar. Switching account in one tab never changes the others.
7. **Import** a `.txt` or `.md` file (max 1 MB). **Export** (download icon) to Markdown or Print / save as PDF.

| Sample account | Password | Notes |
|---|---|---|
| maya@docspace.dev | demo1234 | Owns 3 docs, has 2 shared with her |
| daniel@docspace.dev | demo1234 | Owns 2 docs, has 2 shared with him |
| priya@docspace.dev | demo1234 | Share target; owns one doc shared with both |

Sample accounts are shared by every reviewer, so their data may change while you look, and they can't be deleted. A new account starts empty.

## What is built

| Requirement | Implementation |
|---|---|
| Create, rename, edit, save, reopen | Dashboard and editor; title edit in place (editor or row menu); 800 ms debounced autosave; reopen from either list |
| Rich text | Tiptap: bold, italic, underline, H1-H3, bulleted and numbered lists, undo/redo, shortcuts, active-state toolbar |
| File upload | **.txt and .md only, up to 1 MB** → a new document. Text: each line is a paragraph. Markdown: headings, lists, bold, italic and `<u>` are kept. Checked in the browser and again on the server (type, size, UTF-8, no binary). |
| Sharing | Owner shares by email as Editor, Commenter or Viewer; can change a role or remove access. Owned and shared documents are separate lists with distinct icons; the editor shows "Owned by …" and a role pill. |
| Persistence | Supabase Postgres. Content is stored as editor JSON (lossless structure and formatting). Access is enforced by row-level security in the database, not only in the API. |
| Accounts | Sign-up with a password policy (live checklist; the API and the database both enforce it). Several accounts signed in at once, with a **different account per tab**, a one-click switcher, sign out of one or all, and **Delete account** (password re-check; removes the account, its documents, shares, comments and history). |
| Validation and errors | Every state in the UI spec, plus sign-up errors, conflicts, and role refusals |

**Stretch features**, all five from the brief:

| Stretch | What it does |
|---|---|
| Real-time collaboration indicators | Avatars of who else has the document open; **live cursors and selections** of other people, with their name in their colour; a document shared with you appears in your open list with a toast. Saves and comments by others refresh an idle view. |
| Commenting | Comment on selected text or the whole document. Threads have replies and resolve/reopen, and clicking a quote jumps to the text. Updates reach other open tabs live. |
| Version history | A snapshot per person's 10-minute editing session (50 kept), with preview and restore. Restoring adds a version; it never deletes history. |
| Export | Markdown download, and Print / save as PDF |
| Roles beyond basic access | Owner / Editor / Commenter / Viewer, enforced by RLS and column grants |

**Also:** conflict-safe saving. If someone else saved since you loaded the document, you choose *Load theirs* or *Keep mine* instead of silently overwriting.

**Deliberately not built:**
- simultaneous co-editing of the same paragraph (CRDT)
- suggestion mode
- password reset and email verification (see the security note)
- .docx import

The reasons are in [docs/ARCHITECTURE.md](ARCHITECTURE.md).

## Run locally

Requires Node 20.19+ or 22.13+.

```bash
npm install
cp .env.example .env.local      # fill in your Supabase URL and publishable key
npm run dev                     # http://localhost:3000
```

`.env.local` needs only the two public values named in `.env.example`. They are public by design: RLS protects the data, and the app has no server secret.

To use **your own Supabase project**:
1. Run the files in `supabase/migrations/` in order, in the SQL editor.
2. Run `scripts/seed-users.sql` to create the three demo accounts.
3. Run `npm run seed` to create the six demo documents and their shares (it signs in as each user).

## Tests

| Command | Checks | What it proves | Needs |
|---|---|---|---|
| `npm test` | 16 | Import/export round-trip, title/email/file validation, password policy, role rules, share and sign-up status → HTTP code and UI copy | nothing (offline) |
| `npm run test:rls` | 32 | Against the real database as real users: outsiders and anon see nothing; viewers can't write or comment; commenters can't edit; editors can't delete, share or take ownership; no comment as someone else; versions only via trigger; weak passwords refused by the database | `.env.local` |
| `npm run test:e2e` | 89 | All five core tasks over HTTP as two users, plus sign-up, new-account sharing both ways, the commenter role, comments, version preview/restore, several accounts with a different one per tab, and account deletion | a running app (`BASE=…`, default `http://localhost:3000`) |
| `npm run test:ui` | 47 | Headless Chromium at desktop and phone sizes: sign-up, login, lists, search, create, format, autosave, reload persistence, share, comment/reply/resolve, history, import, two accounts in two tabs of one browser on the same document (each sees the other), switching one tab only, export menu and Markdown download, no sideways scroll on phone | a running app; `npx playwright install chromium` once |

All four suites pass against production at https://docspace-ajaia.netlify.app (2026-11-12). The two live suites create and delete their own documents.

## Project layout

```
src/app/            routes: /login, /signup, / (My documents), /shared, /doc/[id], /api/*
src/components/     AppShell, DocumentList, Editor, DocPanel (comments, history), ShareDialog, ImportDialog, ui
src/lib/core/       pure logic, no I/O: import/export, validation, password policy, roles (unit tested)
src/lib/server/     Supabase client acting as the user; named data-access functions
supabase/migrations schema, RLS, share/sign-up functions, version trigger
scripts/            seed, rls-check, e2e-api, e2e-ui
docs/               submission notes, engineering playbook (adapted), design spec, reference originals
```

## Submission documents

- [docs/ARCHITECTURE.md](ARCHITECTURE.md): the architecture, what was prioritized and why, tradeoffs
- [docs/AI_WORKFLOW.md](AI_WORKFLOW.md): the AI-native workflow note
- [docs/SECURITY_LEDGER.md](SECURITY_LEDGER.md): security controls verified, and known gaps
- [docs/MISTAKES.md](MISTAKES.md): bugs found during the build, with fixes and replay tests
- [docs/reference/](reference/): the original brief, the full UI handoff (spec, preview, 39 screenshots) and the engineering playbook, unmodified
