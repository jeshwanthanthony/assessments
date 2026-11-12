# Read first: rehydrate before ANY work

[`AGENTS.md`](AGENTS.md) is the canonical contract for every agent (Claude,
Codex, anyone) working on AI Native Full Stack Assignment. This block mirrors
its essentials so a Claude session that reads only this file still behaves; if
the two ever differ, `AGENTS.md` wins and this block gets fixed in the same
commit.

1. **Before starting substantive work in every new session, read, in order:**
   (1) `AGENTS.md` or this file, (2) `docs/HANDOFF.md` (where the last agent
   stopped), (3) `docs/AI_CONTEXT.md` (the stable system in two minutes),
   (4) the relevant docs they reference (`docs/CONTEXT_INDEX.md` is the map),
   (5) current Git status, diff and log. Then the code. **The repository and
   current Git state always override stale documentation**; fix the doc in
   the same commit.
2. **Session start, before changing anything:** `git branch --show-current`,
   `git status --short`, `git fetch origin`, the unpushed-commit check, the
   INCOMING-commit check (`git log --oneline HEAD..origin/<branch>`; if it
   prints anything another agent pushed: `git pull --ff-only` and re-read
   `docs/HANDOFF.md`), `git log --oneline -8`, `git stash list`. Dirty files
   or commits the handoff does not mention are another agent's unfinished
   work: read them, reconcile `docs/HANDOFF.md`, never reset, stash or
   force-push over them.
3. **Do not rewrite or "simplify" working logic you have not fully read.** Do
   not scan unrelated files to fill context. The hard rules (gates fail
   closed, no secrets in the browser, one prompt, no invented capability, no
   em or en dashes, additive migrations) are in `AGENTS.md`.
4. **Ship only through `docs/DEPLOYMENT.md`:** typecheck while you work, the
   suites `docs/TESTING.md` names for the area (existing ones too), commit
   with docs in the same commit, push, apply and verify any migration by hand
   BEFORE deploying, deploy through the one deploy command, verify on
   production, record the live version. **Every reported AI bug becomes a
   regression case** (`docs/AI_REGRESSION.md`): reproduce, add the case, fix,
   run that section, confirm, write THE FIX with the date, keep it for ever.
5. **During long or multi-step work, do not wait for the end to update
   context.** Re-read `docs/HANDOFF.md`, `docs/AI_CONTEXT.md` and the relevant
   docs whenever the task changes direction and after major implementation
   decisions; after a long stretch, re-run the item 2 Git checks too. Update
   `docs/HANDOFF.md` often enough that another agent could take over if this
   session stopped unexpectedly, and before anything risky (migration,
   deploy, large refactor); commit AND push each such update. HANDOFF is a
   snapshot, not a diary; history goes in `AGENT_LOG.md`.
6. **Session end, and after every deploy, migration or feature landing:**
   re-verify and update `docs/HANDOFF.md` (branch, live version, what changed,
   in flight, open, next steps), append `AGENT_LOG.md`, update the docs whose
   "update when" clause fired, commit, push.
7. **Never expose or commit secrets, credentials, tokens, `.env` contents,
   customer data or user content**, anywhere: code, docs, handoff, commit
   messages, chat replies, fixtures. Secret NAMES are fine; values never.
8. **Scale is reported, never silent:** check `docs/SCALING.md` before
   building or shipping; if a change touches, worsens or adds a weak point
   under many users, tell the owner (what breaks, at about how many users,
   the fix and its cost) and update `docs/SCALING.md` in the same commit.
9. **Legal and security are reviewed per feature:** a feature that changes
   what is collected, who receives it, or adds a provider moves the legal
   documents in the same commit, never published without the owner's yes.
   The standing rules in `docs/SECURITY_LEDGER.md` bind every new feature; a
   found gap is fixed in the same session or recorded there.
10. **Code quality is a bar:** every change clears `docs/CODE_QUALITY.md`
    (choosing a design: `docs/ENGINEERING_JUDGMENT.md`) and keeps the data
    movable (`docs/DATA_PORTABILITY.md`).
11. **Nothing is hard-coded to one customer, one input or one shape of data.**
    What a rule needs comes from the data or an owner setting. A case that
    truly cannot be generic says why, beside the code and in the doc.
12. **Learn from every mistake, in writing:** every bug and every mistake of
    our own gets an entry in `docs/MISTAKES.md` (steps, fix, replay test,
    undo, never again) in the same commit as the fix; before every push and
    deploy, read the touched area's entries and re-run their replays.
13. **Phone and PC, always, on every platform:** touch and mouse, narrow and
    wide, Safari and Chrome, down to the support line in `docs/PLATFORMS.md`;
    transform and opacity only, no blinking, jitter or trails, reduced motion
    respected.
14. **Say when a fix is a patch:** before fixing a reported bug, check
    `docs/MISTAKES.md` for the same class; if the fix is temporary and the
    problem will return in another form, tell the owner first, with the
    lasting fix and its cost, and recommend the lasting fix.

The rest of this file is the brief for independent security-test sessions.

# Independent security test brief

Use `docs/SECURITY_LEDGER.md` as the single source of truth. Independently
verify the controls it claims and report evidence-based defects. Do not assume
a control works merely because a static assertion exists.

## Secret and View Source audit

Treat every public build-time value as public. Publishable identifiers are
expected in the browser and are not findings by themselves. Their associated
secrets, service keys, API tokens, OAuth secrets, signing keys and provider
keys must never appear in browser-delivered files.

Inspect the source and the built output. Check HTML, JavaScript, CSS, source
maps, comments, error bodies, and documentation. Do not print any discovered
credential into terminal logs or the final report; identify only its type,
file, and line, then recommend immediate revocation.

## Safe live checks

Do not flood production, send real customer emails, alter real users' auth
factors, make a real payment, alter DNS, firewall or auth settings, delete
data, or expose secrets. Use disposable accounts and provider sandbox or test
modes.

## Finding format

For every confirmed issue provide severity, affected file or route, exact
reproduction, observed result, expected result, exploit impact, and the
smallest safe remediation. Separate confirmed defects from defense-in-depth
suggestions. Do not describe the login as unbreakable even if all tests pass.
