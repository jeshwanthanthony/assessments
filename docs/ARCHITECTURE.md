# DocSpace: Architecture Note

## What it is

A small collaborative document editor. You can:

- sign up and sign in
- create, rename, format and save documents
- import .txt or .md files
- share by email as Editor, Commenter or Viewer
- comment, restore older versions, and see other people's cursors live

## How it fits together

```
Browser (Next.js + Tiptap editor)
   │  fetch /api/*                         Realtime (cursors, presence, "shared with you")
   ▼                                            ▲
Next.js API routes on Netlify  ──────────►  Supabase
   acts as the signed-in user                 Auth, Postgres with row-level security, Realtime
```

- **Frontend:** Next.js 16 and TypeScript, ported from the approved UI handoff's CSS. The editor is Tiptap (ProseMirror).
- **Backend:** Next.js API routes. They hold no admin key and act as the signed-in user, so the database decides what each person can see and change.
- **Data:** Supabase Postgres, with five tables: `profiles`, `documents`, `document_shares`, `document_comments`, `document_versions`. Document content is stored as editor JSON, which keeps formatting exactly and needs no HTML cleaning.

## What I prioritized, and why

1. **The five core tasks, working end to end:** create, edit, upload, share, persist. They are what the brief asks for.
2. **Not losing work:**
   - autosave with a visible status (Unsaved, Saving, Saved, Couldn't save · Retry)
   - a conflict check, so two people saving at once never silently overwrite each other
   - a warning before leaving with unsaved changes
3. **Correct access rules,** enforced in the database rather than scattered through the code:
   - owners can share and delete
   - editors can edit
   - commenters can only comment
   - viewers can only read
4. **Following the approved design** closely, including every loading, empty and error state, on desktop and phone.
5. **Stretch work, only after 1-4 were tested:**
   - live cursors and presence
   - comments
   - version history
   - roles
   - export to Markdown and PDF
   - several accounts per browser, one per tab

## Tradeoffs and cuts

| Cut | Why | What it would take |
|---|---|---|
| Two people typing in the same paragraph at once (CRDT) | Large on its own; live cursors and conflict-safe saving cover the main risk | Yjs with a Realtime provider |
| Email verification and password reset on sign-up | Reviewers can sign up and test instantly | Turn on Supabase email confirmation |
| .docx import | .txt and .md cover the need; .docx needs a parser and sanitising | mammoth on the server |
| Suggestion mode | Comments cover review with much less editor complexity | Tracked-change marks |

## Quality and testing

| Suite | Checks | What it covers |
|---|---|---|
| Unit | 16 | Import/export, validation, password rules |
| Database permissions | 32 | Run against the real database as different users |
| API end to end | 89 | All core tasks plus every extra feature |
| Browser | 47 | Desktop and phone, including two accounts in two tabs on one document |

All four suites passed against the live site.
