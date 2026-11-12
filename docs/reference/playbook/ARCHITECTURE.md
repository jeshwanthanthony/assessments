# ARCHITECTURE.md - how the system connects

Last updated: <date>. Replace each placeholder when the piece exists; delete
a section only if the piece will never exist.

## Runtime topology

```
User browser (phone or PC)
  └─ Editor client (UI, local document state, pending changes)
       ├─ HTTPS  /api/*        (auth, document list, sharing, snapshots)
       └─ WebSocket /sync      (real-time edits, presence, acknowledgements)

App server / sync server
  ├─ Request gate (allowlist of API paths and methods, security headers)
  ├─ Sync service (orders and merges edits, broadcasts to collaborators)
  ├─ Storage (documents, change history, snapshots, users, permissions)
  └─ Auth provider (sign-in, sessions)
```

## Frontend state

Where document state lives on the client, how pending (unacknowledged) edits
are held, and what is NOT used. <placeholder>

## The request gate

Every request passes one gate: unknown API paths or methods are rejected
before any handler runs, and security headers are set in one place. New
endpoints must be registered there. <file placeholder>

## Identity and authorization model

- **Anonymous visitor**: <what, if anything, they can reach>.
- **Signed-in user**: every route and every sync message derives the user from
  the verified session, never from the body, and checks the user's permission
  on that document.
- **Collaborator roles**: <owner, editor, viewer, or as decided>.
- **Service credentials**: only on the server.

## Data model in one paragraph

<placeholder: documents, change log or CRDT state, snapshots, users,
memberships/permissions; which store is the source of truth for each.>

## The sync pipeline

```
local edit → pending queue → sync server (validate, check permission, order/merge)
  → persist → acknowledge to sender → broadcast to collaborators → each client applies
```

<placeholder: the merge strategy chosen (OT or CRDT) and why, with a pointer
to docs/DECISIONS.md.>

## Abuse defense layering (order matters)

Input caps → session check → rate limits → permission check → ONLY THEN any
costly work (storage writes, broadcasts, paid calls).

## Deploy and migrations

One deploy command runs the full gate first. Migrations are applied
explicitly and verified BEFORE the dependent deploy. The full loop and
rollback: `docs/DEPLOYMENT.md`.
