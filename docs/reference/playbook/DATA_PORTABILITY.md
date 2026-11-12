# DATA_PORTABILITY.md - growing or moving the database

The map an agent follows before and during a database move (a managed
Postgres today, a bigger Postgres or AWS tomorrow), and the rules that keep
the code of AI Native Full Stack Assignment movable. Read it with
`docs/CODE_QUALITY.md` (rule 2.4) and `docs/SCALING.md`.

## 1. What we run on

Fill this table when the stack is chosen, and keep it current.

| Piece | Today | How tied to the provider |
|---|---|---|
| Database (documents, users, permissions) | | |
| Schema history (migrations folder) | | |
| Extensions | | |
| Scheduled jobs | | |
| Auth | | |
| Data API | | |
| Files (uploads, exports) | | |
| Realtime / sync server | | |
| App servers | | |

## 2. The two ways to grow

**A. Stay on the provider, bigger** (the cheap first step): a larger compute
tier, read replicas for heavy reads, connection pooling for the servers, and
`pg_stat_statements` to find slow queries before scaling hardware. No code
change. Do this first; most "bigger database" needs end here.

**B. Move Postgres elsewhere** (RDS or Aurora Postgres), keeping everything
else:
1. Stand up Postgres (same major version) with the same extensions.
2. Recreate the roles and the auth functions the row-level security
   policies call, or keep the current auth provider and verify its JWTs
   (see 3).
3. Restore with `pg_dump --no-owner` of the app schema (and file metadata
   if files move with paths). The dump is the schema; keep the migrations
   folder as the forward history and apply new migrations by hand exactly
   as today.
4. Run the data API next to the database with the same JWT secret so the
   client keeps working unchanged; or move browser calls behind server
   routes first (see 4) and drop it.
5. Copy file buckets to S3; keep object paths identical; signed URLs come
   from the server.
6. Cut over with a short write freeze: point the server's connection
   secrets at the new home, deploy, verify (the security suite, the RPC
   exposure check, a live edit session), and keep the old database
   read-only for a rollback window.

## 3. Auth is the part to plan

Three options, cheapest first:
1. **Keep the current auth provider only** (database elsewhere): policies
   read the user id from the JWT claims; the new database can do the same
   with a small function reading the request's claims. Least change.
2. **Move to another OIDC provider**: migrate users with password hashes
   where the provider allows it, otherwise a forced reset; MFA factors must
   be re-enrolled. Replace the user lookup in routes with one helper.
3. **Own auth in the server**: most work, most control. Only if 1 and 2 fail.

## 4. Rules that keep the code movable (binding now)

1. **New reads and writes go through a named function** in `src/lib/**` (or a
   typed RPC), not inline queries in components or routes, so a move changes
   one module. The pure core never imports a database client.
2. **Prefer server routes over new browser-side writes** for anything that is
   not a simple user edit of the user's own row; a browser write ties us to
   the data API and to row-level security shapes.
3. **Plain SQL only in migrations**: no dashboard-only changes. A table,
   column, grant, policy, function or job that is not in the migrations
   folder does not exist for the next home.
4. **No new provider-only features** (provider realtime, edge functions, a
   provider vault for new secrets) without writing here how they would move.
5. **Secrets live in the server's secret store**, never in the database,
   except what is already listed here for the move.
6. **Large tables are paged** and every query that grows with a document or
   a history is bounded; this matters more on a bigger database, not less.

## 5. Before any move: the checklist

- [ ] `pg_dump --schema-only` of production equals a fresh database built
      from the migrations folder (drift found = fix it in a migration first).
- [ ] The list of stored secrets and scheduled jobs is written here with their new home.
- [ ] Every browser-side database call is listed with its row-level security policy.
- [ ] The security suite, the RPC exposure check and the AI regression
      suite pass against a staging copy on the new home.
- [ ] A rollback window with the old database read-only is agreed with the owner.
- [ ] Costs compared and told to the owner (`docs/SCALING.md`).
