# Mistakes ledger: what broke, the exact steps, and the rule that stops it again

## The rules

1. Every bug found by clicking, by a test, by the owner or by a user gets an entry here, newest first, in the same commit as its fix: steps, what broke, why, THE FIX, the replay test, the undo, and a "never again" line.
2. Our own mistakes count too (a wrong assumption, a test that proved the wrong thing).
3. Before every push and deploy, re-run the replay of every entry whose area the change touches.
4. Replays never touch real users' data: they use demo accounts and delete what they create.

## Entry format

```
### <ID> (<date>, found by <who/how>)
Steps / Broke / Why / THE FIX / Replay / Undo / Never again
```

## Entries (newest first)

### BUG-2026-11-12-deleted-account-cookie-kept (found by the e2e suite after the speed change)
Steps: 1. Switch session checks to local token verification. 2. Delete an account. 3. Call /api/me with the same browser.
Broke: 200 instead of 401: the browser was still signed in as the deleted account.
Why: the sign-out helper still asked Supabase Auth "who is this?"; for a deleted user that returns nobody, so it skipped clearing the cookie. Before the speed change, requireUser asked the same question and failed, which hid it.
THE FIX: `signOutAccount` compares the token's own subject (`getClaims`), which still identifies a deleted account.
Replay: `npm run test:e2e` ("delete: the session is gone").
Undo: none.
Never again: when changing how identity is checked, run the account-deletion and sign-out tests too, not only the speed measurement.

### BUG-2026-11-12-stale-tab-acts-as-another-account (reported by the owner with a screenshot)
Steps: 1. Tab A: sign up as a new account, create "Doc". 2. Tab B (same browser): sign in as maya@docspace.dev. 3. Back in tab A (still showing the new account), Share "Doc" with Maya.
Broke: "Only the owner can add people to this document." although tab A showed the new account as Owner.
Why: one session cookie per browser. Tab B's sign-in replaced it, so tab A's requests ran as Maya; the database correctly refused. Confirmed in the Supabase auth logs (new account signed in 14:19:39, Maya 14:22:07, same browser) and by reproducing sharing as a new account via the database and the live API (both worked).
THE FIX: each tab pins its account (sessionStorage) and sends x-docspace-user; the server keeps every signed-in account's session in httpOnly cookies and serves each request as the tab's account, or 409 if that account is no longer signed in on the browser (`requireUser`, `src/lib/server/accounts.ts`). Tabs tell each other about sign-ins/outs (BroadcastChannel). This also delivers per-tab accounts.
Replay: `npm run test:e2e` ("per-tab", "switcher" rows), `npm run test:ui` (two tabs, one browser).
Undo: "Sign out of all accounts".
Never again: a browser tab must never act as an account other than the one it shows; every request names its account and the server verifies it.

### BUG-2026-11-12-host-badge-covers-comment-button (found by the browser suite against production only)
Steps: 1. Open a document on the live site at 1280x860. 2. Open Comments. 3. Type a comment and click Comment.
Broke: the click hit Netlify's injected "Powered by Netlify" badge (fixed, bottom-right, about 184x51) instead of the button; locally there is no badge, so local runs passed.
Why: the panel footer right-aligned its button into the corner the host reserves; toasts also sat in that corner.
THE FIX: the Comment button is left-aligned in the panel footer; toasts sit 72 px from the bottom (`DocPanel.tsx`, `globals.css`).
Replay: `BASE=https://docspace-ajaia.netlify.app npm run test:ui` (comments section).
Undo: none.
Never again: run the browser suite against the deployed site, not only locally; keep interactive controls out of the bottom-right corner.

### MISTAKE-2026-11-12-test-doubleclicked-a-space (found by the browser suite)
Steps: double-click the centre of a heading, then click "Comment on selection".
Broke: the composer had no quoted text in the test.
Why: the double-click landed on the space between two words, so nothing was selected. The app was right; the test input was wrong. Investigated by logging the selection at each step before changing anything.
THE FIX: the test selects with Home, Shift+End. The app also falls back to the browser selection when the editor selection is empty (useful for read-only commenters).
Replay: `npm run test:ui` ("comment composer quotes the selected text").
Undo: none.
Never again: when a UI test fails, log the state at each step before changing the app or the test.

### MISTAKE-2026-11-12-tested-a-stale-server (found when new routes returned 404 locally)
Steps: rebuild, then start `next start` while the previous server still holds port 3000.
Broke: every new route answered 404 and the suite reported 15 failures that were not real.
Why: `pkill` does not exist in this shell, so the old server kept serving the previous build.
THE FIX: stop whatever listens on port 3000 (PowerShell `Get-NetTCPConnection -LocalPort 3000 ... Stop-Process`) before starting the new build.
Replay: n/a (process step, recorded in docs/DEPLOYMENT.md "DocSpace specifics").
Undo: none.
Never again: confirm the server under test runs the build you just made before reading a test result.

### MISTAKE-2026-11-12-netlify-upload-skips-next-runtime (found by running the e2e suite against production)
Steps: 1. Create a Netlify site through the API. 2. Deploy by uploading the source (no Git link). 3. Open any page.
Broke: every route returned 404; the deploy summary said "No functions deployed", `plugin_state: none`.
Why: Netlify auto-installs its Next.js runtime only when it detects the framework through the UI or Git setup; an API upload built `.next` and published it as static files.
THE FIX: `[[plugins]] package = "@netlify/plugin-nextjs"` in `netlify.toml`, plus the devDependency.
Replay: `BASE=https://docspace-ajaia.netlify.app npm run test:e2e`.
Undo: none.
Never again: a deploy is not done until the e2e suite passes against the live URL; a "ready" deploy state proves nothing.

### MISTAKE-2026-11-12-security-definer-exposed-over-rest (found by the Supabase security advisor)
Steps: Call `POST /rest/v1/rpc/handle_new_user` or `/rpc/doc_role` with the publishable key.
Broke: nothing exploitable (the trigger function fails outside a trigger; the helpers reveal only the caller's own access), but they were API surface nobody meant to expose.
Why: functions in `public` are exposed by PostgREST and default to EXECUTE for PUBLIC.
THE FIX: revoke EXECUTE on the trigger function; move RLS helpers to schema `private` (migration harden_function_exposure).
Replay: Supabase security advisor (no 0028/0029 findings for these), `npm run test:rls`.
Undo: none.
Never again: helper functions go in `private`; every new function states its grants explicitly; run the advisor after every migration.

### BUG-2026-11-12-insert-returning-blocked-by-rls (found by the seed script)
Steps: As a signed-in user, `insert into documents ... returning id` (supabase-js `.insert().select()`).
Broke: "new row violates row-level security policy for table documents".
Why: RETURNING applies the SELECT policy to the new row; the policy called a STABLE helper that reads `documents`, and the helper's snapshot cannot see a row inserted by the same statement.
THE FIX: the read and update policies check `owner_id = auth.uid()` first, then the helper.
Replay: `npm run seed`, `npm run test:rls` ("owner can read own document"), e2e "1 create a document".
Undo: delete the inserted documents.
Never again: a policy that looks up its own table through a function needs a direct column check for the row's owner.

### MISTAKE-2026-11-12-test-compared-jsonb-as-string (found by the e2e suite)
Steps: Save rich content, reopen, compare `JSON.stringify` of sent and received.
Broke: the test failed although the content was identical.
Why: Postgres `jsonb` does not keep object key order.
THE FIX: the test compares with sorted keys (`canon` in `scripts/e2e-api.ts`).
Replay: `npm run test:e2e` ("4 reopen keeps formatting and structure exactly").
Undo: none.
Never again: compare JSON structurally, never as raw strings, when it has been through `jsonb`.

### MISTAKE-2026-11-12-test-typed-before-focus-returned (found by the browser suite)
Steps: Choose "Heading 1" from the text style menu, immediately press End, Enter, then type.
Broke: the next paragraph's text landed in the heading in the test only.
Why: Tiptap restores editor focus on the next animation frame; the test's keystrokes in the same frame went nowhere. A person cannot type that fast.
THE FIX: the test waits until the editor has focus (`scripts/e2e-ui.ts`). Confirmed by screenshot before changing the test.
Replay: `npm run test:ui` ("after reload: heading kept").
Undo: none.
Never again: before "fixing" an app for a UI test failure, look at the screenshot and decide whether a human could hit it.
