# TESTING.md

| Suite | Command | Checks | Area |
|---|---|---|---|
| Unit | Unknown command: "test"


Did you mean this?
  npm test # Test a package
To see a list of supported npm commands, run:
  npm help | 16 | : import/export, validation, password policy, roles, status copy |
| Access control (live DB) |  | 32 | RLS, grants, share/comment/version rules, sign-up policy |
| API end to end |  (BASE=...) | 89 | five core tasks, sign-up, roles, comments, versions, multi-account per tab, delete account |
| Browser |  (BASE=...) | 47 | full journey at 1280 and 390 px, two tabs/two accounts, live cursors, live share, export |
| Speed |  (BASE=...) | - | share, /api/me and document load times |

Counts are from the last production run (2026-11-12, all passing).

After changing:
- : run unit.
- : run rls-check and e2e.
-  or : run e2e (and perf:share if a hot path changed).
-  or CSS: run the browser suite.

Before a deploy: all four, then e2e and UI again against production.

The live suites use throwaway  accounts. Remove them afterwards; see the open item in docs/MISTAKES.md.
