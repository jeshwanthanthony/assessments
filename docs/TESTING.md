# TESTING.md

| Suite | Command | Checks | Area |
|---|---|---|---|
| Unit | `npm test` | 16 | `src/lib/core`: import/export, validation, password policy, roles, status copy |
| Access control (live DB) | `npm run test:rls` | 32 | RLS, grants, share/comment/version rules, sign-up policy |
| API end to end | `npm run test:e2e` (BASE=...) | 89 | five core tasks, sign-up, roles, comments, versions, multi-account per tab, delete account |
| Browser | `npm run test:ui` (BASE=...) | 47 | full journey at 1280 and 390 px, two tabs/two accounts, live cursors, live share, export |
| Speed | `npm run perf:share` (BASE=...) | - | share, `/api/me` and document load times |

Counts are from the last production run (2026-11-12, all passing).

## After changing

- `src/lib/core`: run unit.
- `supabase/`: run rls-check and e2e.
- `src/app/api` or `src/lib/server`: run e2e, and `perf:share` if a hot path changed.
- `src/components` or CSS: run the browser suite.

Before a deploy: all four, then e2e and UI again against production.

The live suites use throwaway `@docspace.test` accounts. Remove them afterwards; see the open item in `docs/MISTAKES.md`.
