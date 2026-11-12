# HANDOFF.md - where the last agent stopped, and what to do next

**Last updated:** <date> by <agent> (<one line: what this update covers>).
Sections 1 and 2 were verified against Git and production at that time, not
remembered. Where this file and Git disagree, Git wins: fix this file.

Read it right after `AGENTS.md` (then `docs/AI_CONTEXT.md`). Update it DURING
long work, not only at the end: often enough that another agent could take
over if the current session stopped unexpectedly. It answers: where is the
work, what changed, what is in flight, what is open, and exactly what to do
next. It is a snapshot and a pointer document, never a diary: history lives in
`AGENT_LOG.md`, detail in the files it names.

## 1. Where the work is

The working branch (code and deploys), HEAD, uncommitted changes, the state of
`main` and other branches, stashes, and who commits here. Re-verify with Git.

| Fact | Value (verified <date>) |
|---|---|
| Working branch | |
| HEAD | |
| Uncommitted changes | |
| `main` | |
| Other branches | |
| Stashes | |
| Who commits here | |

## 2. What is live

The host, the domain and the version serving production now, verified with
the hosting tool, never from memory.

| Fact | Value (verified <date>) |
|---|---|
| Host / service | |
| Live version | |

## 3. What changed recently

The last five changes only, one line each, newest first. Older history is
`AGENT_LOG.md`.

## 4. In flight

A snapshot: rewrite it in place, never append. What is being worked on, what
changed, decisions taken, unresolved problems, files and areas affected,
verification done and NOT yet done, and the next steps. Or "Nothing is in
flight."

## 5. Open problems

Known open work, one line each, with the doc that owns it. Do not
re-discover.

## 6. Decisions that bind you

The few settled decisions a new agent must not undo, each pointing to
`docs/DECISIONS.md` for the why.

## 7. Traps that cost real time

Only traps that actually happened, one line each, with the safe way round.

## 8. Exact next steps for the next agent

0. If section 4 is not "Nothing is in flight.", finish its next steps first
   (or, if they no longer apply, say why in section 4).
1. Read, in order: `AGENTS.md` (or `CLAUDE.md`), this file,
   `docs/AI_CONTEXT.md`, the docs they point to for your task, then Git
   status, diff and log (commands in `AGENTS.md` "Session start").
2. If Git or production disagree with sections 1, 2 or 4, Git and production
   win: correct this file before starting.
3. Do the task per `AGENTS.md`, keeping section 4 current AS YOU GO. Ship per
   `docs/DEPLOYMENT.md`.
4. Before you stop: update sections 1 to 5 and 8, append to `AGENT_LOG.md`,
   touch whichever doc's "update when" clause fired, commit, push.

## Update rules for this file

- Keep it under about 200 lines. It is a pointer document; move detail into
  the doc that owns it.
- It is a snapshot, not a diary. Rewrite sections in place; section 3 holds
  the last five changes and no more.
- Update it during long work: after a change of direction, after a major
  decision, when a step finishes, and before a migration or deploy. The test:
  could another agent take over from this file alone if your session stopped
  right now?
- Every fact in sections 1 and 2 is re-verified when you update it. Do not
  carry a fact forward from memory.
- When section 4 changes, check section 1 in the same edit, and commit AND
  push the update: another agent may take over from a different machine.
- Names of secrets are fine. Values, tokens, `.env` contents, customer names,
  user content and email addresses are never written here.
- If you stop mid-task, section 4 says what is half done, which files are
  dirty, what is committed but not pushed, what is pushed but not deployed,
  and what is applied to the database but not yet in code.
