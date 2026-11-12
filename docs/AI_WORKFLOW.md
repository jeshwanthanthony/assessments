# AI-native workflow note

## Tools used

- **Claude Code** (Claude Opus) as the main pair: scaffolding, the schema, routes, components and tests, driven from a written engineering playbook (the `AGENTS.md`, `docs/CODE_QUALITY.md`, `docs/ENGINEERING_JUDGMENT.md` family carried over from earlier work).
- **Claude-generated UI handoff** (`docs/design/`): spec, tokens, interactive preview and 39 screenshots, produced and reviewed before any app code.
- **MCP connectors from the same session:**
  - Supabase: create the project, apply migrations, run the security advisor.
  - Netlify: create the site, set env vars, deploy.
- **Playwright** (headless Chromium) so the agent could *see* the UI it built at phone and desktop sizes, not just compile it.

## Where AI materially sped things up

- **Design to code:** porting the preview's CSS and markup into React components, with every state in the spec, took minutes instead of hours.
- **Schema and RLS first draft,** including the SECURITY DEFINER helpers that avoid policy recursion.
- **Test scaffolding:** the 40-check API script and the 21-check browser journey were written fast, which made "test everything after every change" cheap.
- **Infrastructure from the editor:** project creation, migrations, env vars and deploys happened without leaving the session.

## What I changed or rejected

- **Rejected:** "just rebuild it in Tailwind + shadcn because the spec says so." Porting the approved stylesheet was faster and more faithful. The deviation is written down in ARCHITECTURE.md.
- **Rejected:** storing HTML. Kept editor JSON, which is lossless, validatable and needs no sanitising.
- **Rejected:** checking permissions only in the API with a service key. Moved access into RLS and column grants so a route bug cannot leak data.
- **Changed after a failure:** the first RLS read policy used only a helper function. `INSERT … RETURNING` failed, because the function's snapshot cannot see the new row. Added an `owner_id = auth.uid()` shortcut (`docs/MISTAKES.md`).
- **Changed after the advisor:** the trigger function and the RLS helpers were callable over REST. I revoked the trigger function and moved the helpers to a private schema.
- **Changed after the first deploy:** the site served 404s because an API-upload deploy does not auto-apply Netlify's Next.js runtime. I declared the plugin in `netlify.toml`.
- **Fixed the tests, not the app, when the test was wrong:**
  - `jsonb` reorders object keys, so the round-trip check now compares canonically.
  - The browser test typed faster than Tiptap restores focus after a menu, so it now waits for focus like a person would.
  - Each case was confirmed by looking at the screenshot before changing anything.
- **Pinned dependencies:** the agent's first set of pinned versions had a critical Next.js advisory. I upgraded to patched versions until `npm audit` reported 0.

## How I verified correctness, UX quality and reliability

| Layer | Evidence |
|---|---|
| Pure logic | `npm test`: 12 unit tests (import, export round-trip, validation, share copy) |
| Database security | `npm run test:rls`: 22 live checks as real users (outsider, editor, viewer, anon) |
| Full stack | `npm run test:e2e`: 40 HTTP checks of all five tasks, run locally AND against production |
| UX | `npm run test:ui`: 21 browser checks at 1280 px and 390 px (formatting, autosave, reload persistence, share and import dialogs, a second user, presence, no sideways scroll), plus screenshot review against the approved screenshots |
| Security posture | Supabase security advisor, `npm audit`, security headers checked on the live site; findings recorded in `docs/SECURITY_LEDGER.md` |

The rule throughout: an AI-written change counts only when a test or a screenshot I looked at says it works.
