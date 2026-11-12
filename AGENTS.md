# AGENTS.md - rules for every AI agent working in this repo

This file is the CONTRACT for AI agents (Claude, Codex, anyone) working on
DocSpace, a lightweight collaborative document editor.
Read it first, every session, before touching anything. The goal of this
documentation system is simple: **never lose context in this codebase, never
forget what already exists, never rewrite working logic.**

## The product charter: what it is, and the bar

**What it is:** DocSpace, a lightweight document editor for internal teams: sign in, create, format, import (.txt/.md), share by email as Editor or Viewer, and reopen documents. The approved UI is docs/design/UI_SPEC.md. Simultaneous co-editing, comments, version history and AI features are out of scope until the owner says otherwise.

**The engineering bar:** build it the way the best production teams would:
the pattern with the highest proven success rate, the lowest latency and the
fewest moving parts (rule 9 below), measured, tested end to end on the live
product, and explained in plain language. No toy or copy-paste code; no
"probably works".

**Ask the owner straight up.** When a better result needs something only the
owner can give or approve (an upgrade to how data is stored, a paid plan, a
credential or scope, an infrastructure piece like a queue, a business
decision), stop and ask in one short message: what, why, the options, and the
cost. Never silently work around a missing capability, and never invent
configuration. Equally, when a clearer prompt or extra information from the
owner would get a materially better result, say exactly what to send.

## Rehydration protocol (run this at the start of EVERY new session)

You start with zero memory. Before starting ANY substantive work, read these in
this order. They are ordered by return-on-tokens, so do not skip ahead or read
the whole repo "to be safe":

1. **This file** (`AGENTS.md`), or `CLAUDE.md`, which mirrors its essentials.
2. **`docs/HANDOFF.md`** - where the last agent stopped: the working branch,
   what is live, what is in flight, what is open, and the exact next steps.
   Short by design; read all of it.
3. **`docs/AI_CONTEXT.md`** - the stable system in two minutes: product,
   stack, runtime, repository layout, trust boundaries, how work ships.
4. **The relevant docs those two point you to, and only those.**
   `docs/CONTEXT_INDEX.md` is the map of where every kind of knowledge lives.
   Read `docs/INVARIANTS.md` if your change crosses a dangerous area (sync,
   permissions, storage, migrations), and the nearest local `AGENTS.md` in
   the code area you will edit.
5. **Current Git state: status, diff and log.** The exact commands, and what to
   do when you find someone else's unfinished work, are in "Session start"
   below. Git tells you what changed since the handoff was written.
6. **Then inspect the actual code**: the implementation, its callers, its tests
   (`docs/TESTING.md` lists which suites cover which area), and downstream
   effects. `AGENT_LOG.md` (changelog, newest first) tells you what changed
   recently and why; `git log -- <file>` explains code that looks odd.
7. **The repository and current Git state always override stale
   documentation.** If a doc disagrees with the code, with `git log`, or with
   what production reports, trust the code and Git, and fix the doc in the
   same commit.
8. **Do not scan unrelated parts of the repository just to fill context.**

## Session start: never overwrite another agent's unfinished work

Several agents and the owner may commit to the SAME branch, from different
machines, on the same day. Rehydration step 5, before you change anything:

```bash
git branch --show-current     # must match docs/HANDOFF.md section 1
git status --short            # dirty files you did not create = someone's work
git fetch origin && git log --oneline origin/$(git branch --show-current)..HEAD   # your unpushed commits
git log --oneline HEAD..origin/$(git branch --show-current)   # pushed by ANOTHER agent: git pull --ff-only, then re-read docs/HANDOFF.md
git log --oneline -8          # what landed since the handoff was written
git stash list                # not yours; leave them
```

The incoming check matters most: `git status --short` and the unpushed check
both print nothing when another agent has pushed and you have not pulled, so
without it you would work from, and deploy, a stale tree. If it prints
anything, `git pull --ff-only` and re-read `docs/HANDOFF.md` before anything
else.

If the tree is dirty, or there are commits the handoff does not mention, read
`git diff` and `git log -p` for them BEFORE touching anything, and reconcile
`docs/HANDOFF.md` first. Never `git checkout -- .`, `git reset --hard`,
`git stash` or force-push over changes you did not make. Never merge another
branch into the working branch without reading HANDOFF section 1 (it names the
release branch).

## During long or multi-step work: keep context current, do not wait for the end

A session can stop at any moment (a usage limit, a crash, the owner switching
agents mid-task), and whatever exists only in your head or your transcript is
lost when it does. So, while you work:

- **Re-read** `docs/HANDOFF.md`, `docs/AI_CONTEXT.md` and the relevant docs
  whenever the task changes direction and after every major implementation
  decision. If you have been working for a while, re-run the Git checks too:
  another agent may have pushed to the same branch.
- **Update `docs/HANDOFF.md` often enough that another agent could take over
  if this session stopped unexpectedly, right now.** In practice: when
  substantive work starts, after a decision that constrains what comes next,
  when a step finishes, and BEFORE anything risky (a migration, a deploy, a
  large refactor). Commit it with the work it describes, or on its own when
  the work is not yet committable, and PUSH that commit: the next agent may be
  on another machine.
- **HANDOFF is a snapshot, not a diary.** Rewrite its in-flight section in
  place; never append a chronological log to it (history belongs in
  `AGENT_LOG.md`). Keep it concise and current, covering exactly: what is being
  worked on, what changed, important decisions, unresolved problems, the
  files and areas affected, the verification already completed (and what is
  NOT yet verified), and the exact next steps.

## Session end: leave the repo ready for whoever comes next

Before you stop, and also after every major change (a deploy, a migration, a
feature landing), even if the session continues:

1. Update `docs/HANDOFF.md`: branch and live version re-verified against Git
   and production, what changed (the last five only), in flight (or "Nothing
   is in flight"), open problems, next steps.
2. Append the `AGENT_LOG.md` entry and touch the docs whose "update when"
   clause fired (list below and in `docs/CONTEXT_INDEX.md`).
3. Commit and push. Work that exists only in a working tree, a stash or a
   chat transcript does not exist for the next agent.

## Token ROI - what to read for which task

Fill this table as the codebase grows: one row per area, naming the doc to
read first, the code to open, and what to skip.

| Task smells like... | Read (in order) | Skip |
|---|---|---|
| Visual/design change | `DESIGN.md` first, always | - |
| Security review / hardening | `docs/SECURITY_LEDGER.md` first | - |
| Touching sync, permissions, storage, migrations | `docs/INVARIANTS.md`, then the area doc | - |
| An AI bug report or a change to a prompt or model route | `docs/TESTING.md` | - |
| Continue what the last agent left; ship, deploy, roll back | `docs/HANDOFF.md`, `docs/DEPLOYMENT.md` | - |

Budget rule of thumb: rehydration for a normal task should cost about 3 to 6
file reads before you touch code. If you are about to read a 4,000-line file,
grep it for the symbol you need instead.

## Hard rules

1. **Never rewrite or "simplify" existing working logic** you have not fully
   read. Extend it, or leave it. If you believe it is wrong, check
   `docs/DECISIONS.md` and `AGENT_LOG.md` first: most "weird" code is a
   deliberate fix for a real incident.
2. **Never move an abuse, validity or money gate AFTER a paid call**, and
   every gate that spends money or grants access fails CLOSED.
3. **Never put a real secret in browser-delivered code.** Public build-time
   values are public. Privileges must be PROVEN by server-verified tokens,
   never claimed by the client.
4. **One prompt, one truth.** If the product uses an AI model, its knowledge
   and rules live in one place that every surface reuses. Never fork a second
   prompt.
5. **Respect the aesthetic contract** (`DESIGN.md`). Do not restyle what is
   not in scope.
6. **Migrations are additive** and applied explicitly (deploys do not run
   them). Never drop grants or data in a migration.
7. **Verify before you claim.** Run the gates below; report real results.
8. **Prefer proven patterns over invention.** When building something new,
   first look at how successful products do it and copy the established
   pattern: adapting battle-tested designs beats inventing your own.
9. **Never use em or en dashes** ANYWHERE: not in UI copy, generated text,
   emails, docs, comments, or commit messages. They read as AI-written. Use a
   comma, a period, or a hyphen, or rewrite the sentence. Text the product
   generates follows the same rule, guarded by a test.
10. **Never invent a capability.** No user-facing surface may claim, imply or
    invite a feature the product or the user's data does not support.
    Absence of data is never permission to guess: say you do not know, or ask
    one clarifying question.
11. **Never expose or commit a secret, a credential, a token, `.env` contents,
    customer data or user content**: not in code, a doc, `docs/HANDOFF.md`, a
    commit message, a chat reply or a test fixture. Names of secrets are fine;
    values never are. Env files stay git-ignored; secret scans in hooks and CI
    are a backstop, not permission.
12. **Scale is reported, never silent.** Before you build or ship, check
    `docs/SCALING.md`. If your change touches a weak point it lists, makes one
    worse, or adds a new one (a hot row, an unbounded read, a per-instance
    cache that should be shared, a provider limit), tell the owner in plain
    words (what breaks, at about how many users, the fix and its cost) and
    update `docs/SCALING.md` in the same commit. Write code another agent can
    move to a bigger platform: one module per concern, limits as named
    settings, no logic that only works for one user at a time.
13. **Legal and security are reviewed per feature.** Before you build a
    feature, check whether it changes what the product collects, who receives
    it, how users are told, or adds a provider or country; if so, research the
    law it triggers (cite sources with dates), update the legal documents in
    the same commit, and tell the owner. Never publish legal text without the
    owner's yes. Every new feature follows the standing rules in
    `docs/SECURITY_LEDGER.md`; a found security gap is fixed in the same
    session or recorded there as OPEN, and a fix needing owner money or
    accounts is reported to the owner.
14. **Code quality is a bar, not a wish.** Every change clears
    `docs/CODE_QUALITY.md`; how to choose a design first is
    `docs/ENGINEERING_JUDGMENT.md`; code stays movable to another database or
    host per `docs/DATA_PORTABILITY.md`.
15. **Nothing is hard-coded to one customer, one input or one shape of data.**
    Every feature works for any user, any input (wording, typos, several
    requests at once, any document size or structure) and any number of
    things (documents, collaborators, workspaces). What a rule needs comes
    from the data or a setting the owner can change. Real names live only in
    test fixtures, and a fix is proven on more than the case that was
    reported. When something truly cannot be generic, write why beside the
    code and in the area doc.
16. **Learn from every mistake, in writing.** Every bug found by clicking, by
    a test, by the owner or by a user, and every mistake of our own, gets an
    entry in `docs/MISTAKES.md` in the same commit as its fix: the exact
    steps, what broke, why, THE FIX, the replay test, the undo, and a "never
    again" line. Before every push and deploy, read the entries for the area
    you touched and re-run their replay tests.
17. **Phone and PC, always.** Every architectural, visual or feature update
    works on both a phone and a PC: touch and mouse, narrow and wide screens,
    Safari and Chrome. Test it at both sizes and say in the commit which were
    checked. Motion stays smooth on both: transform and opacity only, no
    blinking, jitter, shaking, flashing or trails, and reduced motion
    respected.
18. **Every platform, every version, researched.** Every visual, motion or
    layout change works on every platform people use (every iOS browser is
    WebKit; Android Chrome, Samsung Internet, Firefox, WebViews; Mac and
    Windows browsers, machines without a GPU) down to the support line in
    `docs/PLATFORMS.md`. Never guess a capability: check it there, in MDN's
    compat data or the engine's source. Where no rule exists, find it, write
    it into `docs/PLATFORMS.md` with its evidence, and add a check.
19. **Say when a fix is a patch.** Before fixing a reported bug, check
    `docs/MISTAKES.md` and `AGENT_LOG.md` for the same class. If the fix is
    quick or temporary and the problem will come back in another form, tell
    the owner first: "this is a patch, it will return because <root cause>;
    the lasting fix is <X>, cost <Y>", and recommend the lasting fix. The
    owner decides. Never keep patching a repeating class silently.

## The work protocol (before and after)

Before significant work:
1. Rehydrate in the order above.
2. Open the implementation, its callers and its tests. Reproduce the current
   behavior (run the relevant suite, probe the route, or drive the UI) before
   changing anything.
3. If the code looks wrong or strange, read `git log -p -- <file>` and
   `docs/DECISIONS.md` before deciding it is a bug.
4. Search for an existing implementation (grep) before writing a new module,
   route, cache or prompt.

After significant work:
1. Run the suites for the area (`docs/TESTING.md`), the typecheck, and the
   gates below before a push; deploy only through `docs/DEPLOYMENT.md`.
2. Review the full diff; make sure no test was weakened to pass.
3. Verify on production when deployed, and report what was verified, what was
   not, and what is still broken.
4. Update the persistent context in the same commit (list below).
5. **Every reported AI bug becomes a regression case** (`docs/TESTING.md`):
   reproduce it as typed, add the case, fix, run that section, confirm it
   passes, write THE FIX sentence with the date, and keep the case for ever.

## After every task (yours or a subagent's): the docs stay alive

Documentation only works if it is updated the moment reality changes. When you
(or a subagent you dispatched) finish a change:

- **`docs/HANDOFF.md`**: keep current DURING long work, re-verify before you
  stop and after any deploy, migration or feature landing. Always.
- **`CLAUDE.md` top block**: it mirrors this file's reading order, session
  protocol and core rules. Update it in the same commit whenever any of those
  change here.
- **`AGENT_LOG.md`**: append a changelog entry (what, why, where). Always.
  Newest first; prune the oldest from the bottom if it grows too large.
- **`docs/INVARIANTS.md`**: update if an invariant or dangerous chokepoint
  changed.
- **`docs/TESTING.md`**: update when a suite is added, moved or retired.
- **`docs/DECISIONS.md`**: append if you made a choice a future agent might
  undo without knowing why.
- **`docs/SECURITY_LEDGER.md`**: update if a gate, limit or control changed.
- **`DESIGN.md`**: update if you introduced or changed a visual pattern.
- **`docs/DEPLOYMENT.md`**: update if the build, gate, deploy, migration or
  rollback process changed. **`docs/AI_CONTEXT.md`**: update if the stack,
  runtime, trust model or repository layout changed.
- Leave a one-line pointer comment in the code you touched
  (`// see docs/X.md` or `// see AGENT_LOG.md`).

When you dispatch subagents, include "report what docs need updating" in their
task, and fold their reports into the docs when they finish.

## Verify gates (run before every push)

Typecheck, security lint, security tests, build, dependency audit at high, and
`git diff --check`. List the exact commands here once they exist. Deploy runs
the same chain first; never deploy by calling the hosting CLI on its own. The
full loop, verification and rollback: `docs/DEPLOYMENT.md`.
