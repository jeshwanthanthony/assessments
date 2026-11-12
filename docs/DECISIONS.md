# DECISIONS.md - settled choices and why

Read before changing one of these. Append a decision when you make a choice a future agent might undo without knowing why. Each one says who decided it: the owner, or the agent with the owner's review.

| # | Decision | Why | Decided by | Revisit when |
|---|---|---|---|---|
| D1 | Supabase for auth, Postgres, access control and Realtime; Netlify for hosting | Free tiers reviewers never pay for; RLS puts access rules in the database | Owner | A paid plan or a different host is approved |
| D2 | Next.js 16 App Router, TypeScript, Tiptap 3 | One codebase for UI and API; Tiptap is ProseMirror with a small, stable schema | Agent, owner reviewed | - |
| D3 | Port the approved preview's CSS instead of rebuilding it in Tailwind + shadcn | Faster and pixel-faithful to the reviewed design; tokens map 1:1 if a port is wanted later | Agent, owner reviewed | The team standardises on Tailwind |
| D4 | Store content as editor JSON (`jsonb`), never HTML | Lossless, can be checked by shape, no HTML sanitising, clean Markdown import/export | Agent | - |
| D5 | Access decided in Postgres (RLS, column grants, owner-checked functions); API routes act as the user and hold no service key | A route bug cannot leak another user's data | Agent | Never weaken; extend instead |
| D6 | Optimistic concurrency on save (409 + Load theirs / Keep mine) instead of real-time co-editing | Prevents silent overwrites at a fraction of CRDT cost; co-editing was out of scope | Agent | Simultaneous typing becomes a requirement (then Yjs) |
| D7 | Version history as one snapshot per person per 10-minute session, by trigger, 50 kept | Useful history without a row per keystroke-save | Agent | Storage cost or a "name this version" request |
| D8 | Commenter role between Editor and Viewer | "Roles beyond basic access" with a real use (review without editing) | Agent; stretch list from the owner | - |
| D9 | Sign-up via a database function that creates confirmed accounts, with a password policy and a 30/hour cap | Reviewers must sign up instantly; confirm-email could not be changed from the build tools | Agent; owner asked for sign-up with the policy | Real users: switch to `auth.signUp` with confirmation (SEC-006) |
| D10 | Several accounts per browser, one per tab (server-held sessions, `x-docspace-user`) | Owner asked for it; it is also the lasting fix for the stale-tab bug | Owner | - |
| D11 | Delete account requires the password and cannot delete sample accounts | Irreversible; sample accounts are shared by reviewers | Agent; owner asked for deletion | - |
| D12 | Verify session tokens locally (`getClaims`, ES256) | Removes a network round trip from every request (share went from about 150 ms to 110 ms warm) | Agent; owner asked for faster sharing | Instant revocation is required (then add a short-lived deny list) |
| D13 | Presence, cursors and share notifications on public Realtime broadcast channels | No content travels on them; simplest setup | Agent | Names on channels become sensitive (then private channels + RLS) |
| D14 | Keep the Netlify badge, move UI out of its corner | Respect the host's free-tier branding; the conflict was ours to solve | Agent | The badge is turned off in Netlify settings |
| D15 | Sole commit author is the owner; AI use is disclosed in `docs/AI_WORKFLOW.md` instead of commit trailers | Owner's instruction | Owner | - |
