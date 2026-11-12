# AI-native workflow note

How DocSpace was built. It separates the decisions I made from the work and decisions of the AI tools, and lists only steps and test results that actually happened.

## 1. My workflow

| # | Step | Who decided |
|---|---|---|
| 1 | Used **ChatGPT (Sol 6.1)** to analyze the brief, list the requirements, prioritize functionality and choose the stack. | Me, with ChatGPT as analyst |
| 2 | Gathered the Markdown docs and engineering playbook from my earlier product (HireMaitre). I had an AI agent strip everything product-specific and keep only the rules and processes (`docs/reference/playbook/`). | Me |
| 3 | Used a **separate UI design agent (Claude Opus 5.5)** to create the interactive preview, design system, `UI_SPEC.md` and 39 screenshots (`docs/reference/DocSpace_UI_Handoff/`). | Me (direction); design agent (output) |
| 4 | **Reviewed the UI handoff** before any application code. | Me |
| 5 | Opened **Cursor** and gave the main coding agent (**Claude Code, Opus 5.5**) the original brief, `UI_SPEC.md`, the design ZIP and the engineering context. | Me |
| 6 | Chose **Supabase** (auth, database, persistence, access control) and **Netlify** (deployment). | Me |
| 7 | Had the agent use the **Supabase and Netlify MCP connectors**: project creation, migrations, security advisor, env vars, deploys. | Me (which tools); agent (the calls) |
| 8 | Directed scope during the build: run tests for core tasks 1-5, deploy with a public link; then add sign-up with a strong password policy and all five stretch features; keep every original document; write this note. | Me |

## 2. What the AI decided, and what I changed or rejected

Decisions the coding agent proposed and implemented (I reviewed the results; the reasons are in `docs/ARCHITECTURE.md`):

- **Next.js 16 App Router + Tiptap 3**, with content stored as editor JSON rather than HTML. JSON is lossless, can be checked by shape, and needs no HTML sanitising.
- **Access enforced in Postgres** (RLS, column grants, owner-checked functions). The API acts as the signed-in user and never holds a service key.
- **Optimistic concurrency** on save (409 with *Load theirs* / *Keep mine*). Nothing is overwritten silently.
- **Version history** as one snapshot per person's 10-minute session, written by a database trigger.
- **The Commenter role** as the "beyond basic" permission tier.

Changed or rejected along the way:

| AI output | What happened |
|---|---|
| First pinned dependency set (Next 15.1.3) | `npm audit` showed a critical Next.js advisory. Upgraded to patched versions (Next 16.4.6, Tiptap 3.33.1); audit then reported 0 vulnerabilities. |
| Rebuilding the UI in Tailwind + shadcn, as the spec names | Not done. The agent ported the approved preview's CSS and tokens directly: more faithful and faster. The deviation is documented. |
| First RLS read policy (helper function only) | Broke `INSERT … RETURNING`, because the helper's snapshot can't see the new row. Added an `owner_id` shortcut. |
| Helper and trigger functions in `public` | Supabase's security advisor showed they were callable over REST. Revoked access and moved the helpers to a private schema. |
| First Netlify deploy (upload, no plugin declared) | Every route returned 404. Declared `@netlify/plugin-nextjs` and redeployed. |
| Sign-up via Supabase `auth.signUp` | Rejected. Email confirmation is on by default and could not be changed from the build tools, so reviewers couldn't sign up instantly. Replaced with a database function that enforces the same password policy, with a global rate limit. The cost (no email-ownership check) is recorded as SEC-006, with the fix. |
| Comment button right-aligned in the panel footer | On production only, Netlify's "Powered by Netlify" badge covered it. Moved the button and the toasts clear of the badge. |

Times the test was wrong, not the app (each checked by screenshot or step-by-step logging before changing anything):
- `jsonb` reorders object keys, so the test now compares JSON structurally.
- The test typed faster than the editor regains focus after a menu.
- The test matched Next's hidden route announcer instead of the form alert.
- A double-click landed on a space between words, so nothing was selected.
- A stale local server was still serving the previous build.

All are recorded in `docs/MISTAKES.md` with replay tests.

## 3. Where AI materially sped things up

- **Design to code:** every screen and state in the spec, ported from the preview, in a fraction of the hand-coding time.
- **Schema, RLS and SQL functions,** including the policy-recursion workaround.
- **Tests:** four suites, which made re-running everything after each change cheap.
- **Infrastructure:** creating the database, running migrations, setting env vars and deploying all happened from the same session through MCP.

## 4. How correctness, UX and reliability were verified

| Layer | Evidence (final run, 2026-11-12) |
|---|---|
| Pure logic | `npm test`: 16/16 |
| Database access control, as real users | `npm run test:rls`: 32/32 |
| Full stack over HTTP (core tasks 1-5, sign-up, roles, comments, versions) | `npm run test:e2e`: 62/62 against production |
| UX in a real browser at 1280 px and 390 px | `npm run test:ui`: 31/31 against production. Screenshots compared with the approved handoff. |
| Security | Supabase security advisor (2 findings fixed); `npm audit` (0); security headers checked on the live site; open items in `docs/SECURITY_LEDGER.md` |
| Deployment | Each deploy counted as done only after both live suites passed against https://docspace-ajaia.netlify.app |

The rule throughout: AI output counted as done only when a test, or a screenshot I reviewed, showed it working.
