# CONTEXT_INDEX.md - where every kind of knowledge lives

The map. Read `AGENTS.md` first (rules and rehydration order), then use this to
jump straight to what your task needs. Ordered for token ROI: the files at the
top of each group answer the most questions per token. Add a row the day a
doc is created; remove it the day the doc is deleted.

## The core documents

| Document | What it answers | Update when... |
|---|---|---|
| `AGENTS.md` | Rules for agents, rehydration protocol, session start and end, hard rules | a rule changes |
| `CLAUDE.md` | The mirror of `AGENTS.md` essentials, plus the security-test brief | `AGENTS.md` changes |
| `docs/HANDOFF.md` | Mandatory read 2 every session: branch, what is live, in flight (a snapshot, never a diary), open, exact next steps | continuously during long work; before every session ends; after any deploy, migration or feature landing |
| `docs/AI_CONTEXT.md` | The stable system in two minutes: product, stack, layout, trust boundaries, how work ships | the stack, runtime, trust model or layout changes |
| `docs/ARCHITECTURE.md` | Topology, identity model, data model, the sync pipeline, defense layering | a component, flow or boundary changes |
| `docs/INVARIANTS.md` | Rules that must always hold, with where each is enforced and proven | an invariant or dangerous chokepoint changes |
| `docs/CODE_QUALITY.md` | The bar every change clears, and the "before you say done" checklist | the owner raises the bar, or a shipped bug earns a rule |
| `docs/ENGINEERING_JUDGMENT.md` | How to decide before the code: how far to trust advice, the design questions, when not to add structure | a whole class of decisions changes (a single lesson goes in `MISTAKES.md`) |
| `docs/DATA_PORTABILITY.md` | Keeping data and code movable to another database or host | the stack changes or a move is planned |
| `docs/PLATFORMS.md` | Phone and PC on every engine: the support line, compositor rules, motion rules, exceptions, evidence | a rule, an exception or the support line changes; new evidence |
| `docs/SECURITY_LEDGER.md` | Findings with their state, controls verified, standing rules for new features, research log | a finding is fixed, accepted or found; a control is verified |
| `docs/DEPLOYMENT.md` | The one way to ship: gates, migrations, deploy, verify, roll back | the build, gate, deploy, migration or rollback process changes |
| `docs/TESTING.md` | The AI regression method and THE FIX ledger | an AI bug is fixed or a section is added |
| `docs/MISTAKES.md` | Every bug and our own mistakes: steps, fix, replay, undo, never again | in the same commit as every fix |
| `DESIGN.md` | The visual system | a visual pattern is introduced or changed |
| `FONTS.md` | Type choices, liked and rejected, with reasons | a font is tried, adopted or rejected |
| `AGENT_LOG.md` | Changelog, newest first, with the reasoning | after every task |
| `docs/TESTING.md` | Which suites cover which area, and what to run after changing X | a suite is added, moved or retired |
| `docs/DECISIONS.md` | Settled choices and why | a choice is made that a future agent might undo |
| `docs/SCALING.md` | Known weak points under many users, with the fix and its cost | a change touches, worsens or adds a weak point |

## Local AGENTS.md files (rules for a code area, next to the code)

List each one here with a one-line summary once it exists (client, sync
server, migrations).

## Verification suites

| Command | What it proves |
|---|---|
| `<command>` | <placeholder> |

## Reading paths by task (the mandatory reads, plus one path; not the repo)

| Task | Read, in order |
|---|---|
| Continue where the last agent stopped | `HANDOFF.md` (all of it) -> `AI_CONTEXT.md` -> the area doc -> `git status`, `git diff`, `git log` (Git wins where it disagrees) |
| Ship, deploy, verify, roll back | `DEPLOYMENT.md` -> `TESTING.md` "After changing X" |
| Choose a design, add a module, or review code | `ENGINEERING_JUDGMENT.md` -> `CODE_QUALITY.md` -> `INVARIANTS.md` for the area -> `DECISIONS.md` for a settled choice |
| Fix a user-visible bug | the flow in `ARCHITECTURE.md` -> the named file and its tests (`TESTING.md`) -> for an AI bug, `AI_REGRESSION.md` (add the case first) -> `MISTAKES.md` |
| Visual change | `DESIGN.md` -> `FONTS.md` -> `PLATFORMS.md` |
| Security review | `SECURITY_LEDGER.md` -> `INVARIANTS.md` -> the `CLAUDE.md` brief |

## Source of truth ordering

1. **Code** (when docs and code disagree, code wins; then fix the doc)
2. **Production database** (for schema and functions)
3. These docs
4. Your memory of the conversation: lowest. Re-check before asserting.
