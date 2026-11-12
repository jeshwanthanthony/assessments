# INVARIANTS.md: rules that must stay true in every release

Each invariant names where it is enforced and which test proves it. A rule without both is a goal, not an invariant.

1. **The user is derived from the verified session, never from the request body.** Enforced: `requireUser` (`auth.getUser()`), RLS on `auth.uid()`. Proven: e2e "unauthenticated API call is 401", rls-check.
2. **Only the owner and people the document is shared with can read it; anonymous users read nothing.** Enforced: RLS `documents_read`. Proven: rls-check "unshared user cannot read", "anonymous cannot read".
3. **Viewers never write; editors never delete, share or change the owner.** Enforced: RLS `documents_update` / `documents_delete`, column grant `update(title, content)`, `share_document` ownership check. Proven: rls-check, e2e "3 …".
4. **Shares change only through the owner-checked functions.** Enforced: no write policies + revoked grants on `document_shares`. Proven: rls-check "shares cannot be inserted directly".
5. **A saved edit is never silently overwritten.** Enforced: `baseUpdatedAt` optimistic concurrency in `PATCH /api/documents/:id` (409 + latest). Proven: e2e "4 stale save is a 409 conflict", rls-check "write against a stale version".
6. **An unsaved edit is never dropped on a failed save.** Enforced: `Editor.flush` re-queues the patch and shows Retry; `beforeunload` warns. Proven: UI save-error state (manual: `?` offline), unit of the queue logic is TODO.
7. **Formatting survives save and reopen exactly.** Enforced: content stored as Tiptap JSON (`jsonb`), validated by `isDocJSON`. Proven: e2e "4 reopen keeps formatting", UI "after reload: …".
8. **Uploads are .txt/.md, at most 1 MB, UTF-8 text, checked on client and server by the same function.** Enforced: `checkImportFile` + import route. Proven: unit tests, e2e "2 …".
9. **No server secret exists in the app; the browser holds only the publishable key.** Enforced: `.env.example`, no service key anywhere. Proven: source review (SECURITY_LEDGER).
10. **No invented capability:** the UI offers only what the role allows (no Share for non-owners, read-only editor for viewers). Enforced: `DocumentList`, `Editor`. Proven: UI and e2e role checks.
11. **Migrations are additive and recorded** in `supabase/migrations/` with the live history in their header.
