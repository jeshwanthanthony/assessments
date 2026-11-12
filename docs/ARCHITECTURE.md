# Architecture note

## The shape

```
Browser (Next.js client components)
  ├─ fetch /api/*  ──▶ Next.js route handlers (Netlify functions)
  │                     └─ Supabase client created per request FROM THE USER'S COOKIE
  │                          └─ Postgres: RLS + column grants + share functions decide access
  └─ Supabase Realtime (presence + "saved" broadcast per document)
```

- **Next.js 16 (App Router) + TypeScript** on Netlify. `src/proxy.ts` refreshes the session cookie and sends signed-out visitors to `/login`.
- **Supabase** provides auth (email and password, seeded accounts), Postgres and Realtime.
- **Tiptap 3 (ProseMirror)** is the editor. The schema is cut down to what the spec allows: paragraphs, H1-H3, lists, bold, italic and underline.
- **UI** is ported from the approved preview's CSS and tokens (`docs/design/`), with lucide icons. I chose this over rebuilding it in Tailwind and shadcn. The preview's stylesheet is the visual source of truth, and porting it pixel for pixel was faster and more faithful than re-deriving it utility by utility. The tokens and class names map one to one, so moving to Tailwind later is mechanical.

## Data model

| Table | Purpose |
|---|---|
| `profiles` | id (= auth user), email, name, avatar colour; created by trigger |
| `documents` | owner_id, title, `content jsonb` (Tiptap JSON), updated_at (trigger) |
| `document_shares` | (document_id, user_id) → role `editor` or `viewer` |

Content is stored as **editor JSON, not HTML**. It is lossless for the formatting we support, can be validated by shape, never needs HTML sanitising on render (ProseMirror only renders nodes its schema knows), and converts cleanly to Markdown for import and export.

## Where access is decided (and why there)

Access lives in **the database**. The API routes do not hold a service key. They act as the signed-in user, so even a bug in a route cannot read or write a row the user has no right to.

- **Read:** you own the document, or you have a share row.
- **Update:** owner or editor. A column grant allows only `title` and `content`, so `owner_id` can never change.
- **Delete:** owner only.
- **Shares:** there are no write policies. Writes go only through `share_document` and `update_share`, which check ownership and return a status (`no_user`, `already_shared`, `is_owner`…) that the API maps to an HTTP code and the exact UI copy.

`scripts/rls-check.ts` proves these rules live, as real users.

## Saving: why it is safe

- **Autosave:** debounced 800 ms after the last change, with one request in flight at a time. Edits made during a save are sent right after it.
- **Failed save:** the change stays queued, the status shows *Couldn't save · Retry*, and leaving the page warns.
- **Optimistic concurrency:** every save carries the `updated_at` it was based on. If someone else saved in between, the update matches no row and the API returns **409** with the latest version. The user picks *Load theirs* or *Keep mine*. Nothing is overwritten silently.
- **Presence channel:** a "saved" broadcast lets an idle tab pull the newer version automatically.

## What I prioritized, and why

1. **The five core tasks, end to end, with depth where users feel it.** For an editor, the top fear is losing work (the seeded research doc says so too). So autosave states, retry, conflict detection and lossless storage got the depth.
2. **Access control that is correct by construction.** RLS plus column grants, tested against the live database, rather than checks scattered across routes.
3. **Fidelity to the approved design.** All states in the 39 screenshots: loading, empty, error, validation and phone layouts.
4. **Verification.** Unit, database, API and browser tests, run locally and against production.
5. **Stretch, only after 1-4 were green:** Viewer role (cheap given the RLS design), presence (cheap with Supabase Realtime), conflict handling, and export.

## Tradeoffs and cuts

| Cut | Why | What it would take |
|---|---|---|
| Simultaneous co-editing (CRDT) | The spec put it out of scope, and real-time merge is a project of its own. Presence, idle refresh and 409 conflict handling cover the "two people, one doc" risk honestly. | Yjs + y-prosemirror over a Realtime or websocket provider, persisting Yjs updates |
| Sign-up, password reset | Seeded accounts let reviewers test sharing in seconds | Supabase sign-up + email confirmation screens (SEC-004 in `docs/SECURITY_LEDGER.md`) |
| .docx import | .txt and .md cover the product need; .docx needs a parser (mammoth) and sanitising | mammoth → HTML → Tiptap JSON on the server |
| Version history, comments | Spec out of scope | A `document_versions` table written on save; comments as anchored marks |
| Tailwind + shadcn | See "UI" above | Mechanical port; tokens already exist in `docs/design/tailwind.theme.ts` |

## Known limits

- Last save wins only when the user explicitly chooses "Keep mine".
- Lists hold at most 500 documents per scope, with no pagination.
- Presence uses a public channel per document id (`docs/SECURITY_LEDGER.md` SEC-005).
