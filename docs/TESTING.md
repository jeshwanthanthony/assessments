# TESTING.md

| Suite | Command | Area |
|---|---|---|
| Unit | `npm test` | `src/lib/core` (import, export, validation, share copy) |
| Access control (live DB) | `npm run test:rls` | RLS, grants, share functions |
| API end to end | `npm run test:e2e` (BASE=...) | all five core tasks over HTTP |
| Browser | `npm run test:ui` (BASE=...) | user journey at 1280 and 390 px |

After changing: `src/lib/core` -> unit; `supabase/` -> rls-check + e2e; `src/app/api` -> e2e; `src/components` or CSS -> ui. Before a deploy: all four.
