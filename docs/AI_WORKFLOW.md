# DocSpace: AI Workflow Note

## Tools I used

- **ChatGPT (Sol 6.1):** to plan.
- **A UI design agent (Claude Opus 5.5):** to design.
- **Cursor with a coding agent (Claude Code, Opus 5.5):** to build.
- **MCP connectors:** for Supabase and Netlify.

## My workflow

| Step | What I did |
|---|---|
| 1 | Used ChatGPT (Sol 6.1) to analyze the brief, list the requirements, prioritize features and choose the stack. |
| 2 | Gathered the Markdown docs and engineering playbook from my earlier project (HireMaitre) as context, generalised so they contain no product details. |
| 3 | Used a separate UI design agent (Opus 5.5) to create the interactive preview, design system, UI spec and 39 screenshots. |
| 4 | Reviewed the UI handoff before starting full-stack development. |
| 5 | Opened Cursor and gave the coding agent the brief, `UI_SPEC.md`, the design ZIP and the engineering context. |
| 6 | Chose Supabase for auth and data, and Netlify for hosting. |
| 7 | Had the agent use the Supabase and Netlify MCP connectors to create the database, run migrations, check security, set env vars and deploy. |
| 8 | Directed scope while building: tests for the core tasks first, then sign-up with a password policy, the stretch features, an account switcher with one account per tab, account deletion, live cursors and faster sharing. I tested the live app myself and reported bugs. |

## Where AI sped things up

- Turning the approved design into working screens with every loading, empty and error state.
- Writing the database schema and access rules.
- Writing four test suites, which made re-testing everything after each change cheap.
- Creating the database, migrating and deploying without leaving the editor.

## My decisions vs. the AI's

**I decided:** the stack (Supabase, Netlify); priorities (core tasks before stretch); every feature added after the first release; that originals are never edited; and that I am the only commit author.

**The AI proposed and I accepted:**
- access rules enforced in the database
- storing documents as editor JSON
- conflict-safe saving
- a version snapshot per editing session
- a Commenter role
- checking logins locally to make requests faster

## What I changed or rejected

| AI output | What happened |
|---|---|
| First set of package versions | A security audit flagged a critical Next.js issue. Upgraded before writing app code. |
| Rebuild the UI in Tailwind + shadcn | Not done. Porting the approved CSS was faster and matched the design exactly. |
| Supabase's built-in sign-up | Needed email confirmation, which would slow reviewers down. Replaced with a database function that enforces the same password rules. The tradeoff is documented. |
| First access rule for new documents | Blocked creating documents. Fixed. |
| Helper functions exposed over the API | Found by Supabase's security advisor. Locked down. |
| First Netlify deploy | Every page returned 404. Added the Next.js plugin. |
| Comment button placement | Netlify's badge covered it on the live site only. Moved it. |

## Bugs found, and how

- **Found by me:** sharing failed on my new account. The agent used the auth logs to find the cause: another tab had signed in as a different user, and both tabs shared one login. The fix gives each tab its own account and has the server verify it.
- **Found by tests:**
  - deleting an account left the browser signed in
  - a stale test server reported failures that weren't real
- **Tests that were wrong, not the app:** four cases. Each was checked with a screenshot or step-by-step logging before changing anything.

All are written up in `docs/MISTAKES.md` with steps, fix and a replay test.

## How I verified it

- **Correctness:** 16 unit tests, 32 database permission checks run as real users, and 89 API checks covering all five core tasks and every extra feature.
- **UX:** 47 browser checks at desktop and phone sizes (including two accounts in two tabs on one document), plus screenshots compared with the approved design.
- **Security:**
  - Supabase security advisor (2 issues fixed)
  - `npm audit` (0 vulnerabilities)
  - no secrets in the repo
  - security headers checked on the live site
  - known gaps listed in `docs/SECURITY_LEDGER.md`
- **Deployment:** a release counted only after both live suites passed against https://docspace-ajaia.netlify.app.

AI wrote most of the code. A feature counted as done only when a test or my own check on the live site confirmed it.
