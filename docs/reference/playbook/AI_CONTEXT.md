# AI_CONTEXT.md - the stable facts an agent needs in two minutes

Stable project knowledge that rarely changes. What changes daily is in
`docs/HANDOFF.md` (where the last agent stopped). Topology diagrams and
request paths are in `docs/ARCHITECTURE.md`; this file is the short version
with the traps.

## What this is

AI Native Full Stack Assignment: a mini real-time collaborative document
editor. Users sign in, create documents, share them, and edit them together
live. <one more line when the scope is settled>

## Stack and runtime

- Client: <framework, build tool>.
- Sync server: <runtime, transport (WebSocket), merge strategy>.
- Storage: <database, how documents and history are stored>.
- Auth: <provider, session model>.
- Hosting: <host, how it is deployed>.

## Repository layout (where to look)

| Path | What lives there |
|---|---|
| `<client dir>` | The editor client |
| `<server dir>` | API routes and the sync server |
| `<migrations dir>` | Additive, explicitly applied migrations |
| `tests/` | Test suites (`docs/TESTING.md` maps them to areas) |
| `docs/` | The context system (see `docs/CONTEXT_INDEX.md`) |
| `AGENT_LOG.md` | Changelog, newest first, with the reasoning behind each change |

## How work ships (details: `docs/DEPLOYMENT.md`)

- Work and deploy from the branch named in `docs/HANDOFF.md`.
- One deploy command runs the full gate first. The build alone is not a gate.
- Migrations are applied by hand and verified BEFORE the code that needs them
  is deployed.
- CI validates pushes; it never deploys and holds no production secrets.

## Trust boundaries (details: `docs/SECURITY_LEDGER.md`)

- Every route and every sync message derives the user from the verified
  session, never from the body, and checks permission on that document.
- Anything from a client (edits, files, headers) is untrusted.
- Public build-time values are public by definition. Server secrets live only
  on the server.
- Every gate that spends money or grants access fails CLOSED and runs BEFORE
  the costly work.

## Non-negotiables (the full list with reasons: `AGENTS.md`, "Hard rules")

Never rewrite working logic you have not read. No invented capability. No em
or en dashes anywhere. Migrations additive. Verify on production before
claiming a fix. Docs updated in the same commit.

## Who works here and how they hand over

The owner may run several AI agents against the same branch, sometimes
alternating mid-task, from different machines. So:

- Git is the shared memory. Every session reads, before substantive work:
  `AGENTS.md` (or `CLAUDE.md`), `docs/HANDOFF.md`, this file, the relevant
  docs, then Git status, diff and log. The repository and Git state override
  any doc that disagrees.
- During long work `docs/HANDOFF.md` is kept current as you go (a snapshot,
  not a diary), so another agent can take over if a session stops mid-task.
- The repo's docs, not the chat transcript, are the source of truth for what
  was done. If a transcript and `git log` disagree, `git log` wins.
