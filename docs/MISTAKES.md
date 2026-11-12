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
