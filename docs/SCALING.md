# SCALING.md - weak points under many users

Read before building or shipping (AGENTS.md hard rule 12). The thresholds are estimates from how the code works and the free-tier limits; none of them has been load-tested. Update this file in the same commit when a change touches one of these.

| # | Weak point | What breaks, at about | Fix and cost |
|---|---|---|---|
| S1 | Lists return at most 500 documents per scope, with no pagination | A user with over 500 documents sees only the newest 500 | Cursor pagination on `updated_at` (half a day) |
| S2 | Autosave sends the whole document (up to 1 MB) every 800 ms of typing | Large documents with many active editors use a lot of bandwidth and egress; the free tier's egress is the first limit | Send ProseMirror steps or Yjs updates instead of full snapshots (days; ties into co-editing) |
| S3 | Every save updates the current version row (trigger) | Doubles writes per save; fine for small teams, noticeable at thousands of saves per minute | Snapshot on idle or on a timer instead of on every save (hours) |
| S4 | Cursor broadcasts at most every 80 ms per person, plus presence | Supabase free Realtime: 200 concurrent connections and a monthly message quota; about 200 people with documents open at once, or a busy month, hits it | Lower the cursor rate when more than N people are in a document; paid plan for more connections |
| S5 | Sign-up has a global cap of 30 new accounts per hour | A real launch would turn people away | Per-IP rate limit plus email confirmation (SEC-006) |
| S6 | Several accounts per browser are kept in cookies (refresh token and access token per account) | More than 5 accounts are dropped; headers grow by about 1 KB per account | Server-side session table keyed by an opaque browser id (a day) |
| S7 | Netlify functions cold-start | The first request after idle takes about 250 ms more than warm ones (measured: 248 ms vs 107-112 ms) | Keep-warm ping or the edge runtime for hot routes |
| S8 | Comments load all at once (limit 1000 per document) | Very busy documents load slowly | Paginate threads; load replies on demand |
