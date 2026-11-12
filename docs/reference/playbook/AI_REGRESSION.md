# AI regression suite (the inner loop for every AI feature)

A permanent, growing set of realistic user conversations with expected
outcomes, organised so one area can be tested alone, where every reported bug
becomes a case that can never silently come back, and where every run records
pass/fail, cost and latency next to the previous run. This file is the
contract; the code lives in `tests/ai-regression/` once it exists.

## Where things live

| Path | What |
|---|---|
| `tests/ai-regression/run.ts` | The runner |
| `tests/ai-regression/cases/<section>.ts` | One file per section; each case says what the user types, what is expected, why the case exists, and (for bugs) the report and THE FIX |
| `tests/ai-regression/results/runs.jsonl` | One line per run: date, commit, mode, per-case pass/fail with reasons, turns, average ms per turn, cost |
| `tests/ai-regression/results/LATEST.md` | Generated: the newest run per mode, per section, compared with the previous run |

## The two modes

- **Offline** drives the REAL route handler on a fake backend with a SCRIPTED
  model. Whatever lands does so on the deterministic path (parsers, guards,
  state). A turn may script a realistic model output to prove the layer under
  it. Free, runs in seconds, no network. This is the mode to run on every
  change.
- **Live** runs the same conversations against the deployed app with the real
  model, as a disposable test session. Budgeted: run once per deploy, or one
  section when a bug in that area is fixed. It never touches real users' data
  and never performs an irreversible action.

A case lists the modes it can run in. Answers that are the model's reading of
the data are live only; deterministic behaviour runs in both.

## Known failures

A case that documents a bug whose fix lands later is marked as an expected
failure with the phase, the reason, and the exact failure lines it produces.
While it fails for that reason it is reported as XFAIL and does not fail the
run. A case failing for any other reason is a plain FAIL. When it passes it is
an XPASS and FAILS the run until the marker is removed and THE FIX is written,
in the commit that fixed it. Write the reason only after reading the failure
on the unfixed code.

## Sections

One section per area of AI behaviour, plus `bugs` (one case per report,
newest first, with THE FIX). List each section here with its area and what
the user does in it.

| Section | Area | What the user does |
|---|---|---|
| `bugs` | Reported bugs | One case per report, newest first, with THE FIX |

## Every reported bug becomes a case (the process)

When the owner (or anyone) reports an AI bug:

1. **Reproduce it** as the user typed it: offline first, live if the model is
   part of it.
2. **Add the case** to `cases/bugs.ts`: id `BUG-<yyyy-mm-dd>-<slug>`, the
   report in one or two sentences (no user names, no content beyond the
   phrase), the phrase(s) as turns, the expected fixed behaviour. Add closely
   related variations to the matching regular section. A case written before
   its fix carries the expected-failure marker; confirm it fails for the
   documented reason first.
3. **Make the fix.**
4. **Run that section** (`bugs` and the area's section), offline, then live
   for that section if the model is involved.
5. **Confirm the case passes**, then fill in THE FIX: one sentence on what
   changed, with the date (and commit when known), in the case.
6. **Keep it for ever.** Cases are never deleted; a case whose expectation
   changes for a good reason gets the reason in its `why`.
7. **Record the run** (the runner does) and read the comparison: regressions,
   fixed, cost and latency deltas. Put the one-line result in `AGENT_LOG.md`.

Everything in step 5 also goes in the THE FIX ledger below, so the history is
readable without opening the code. A bug on an AI surface the runner cannot
replay gets the same record in that surface's deterministic suite and a line
in the ledger.

## THE FIX ledger (newest first)

Format: `- **<case id>** (<date>, <commit>): <one sentence on what changed>.
See docs/MISTAKES.md <entry id>.`

## Cost and latency

- Live cost is an ESTIMATE from token usage at list prices; the provider's
  invoice is the truth. Record the per-turn average and the cost of a full run.
- The runner takes a budget and stops, marking the rest "budget", when the
  estimate would pass it. Ask the owner to raise the budget when a run needs
  more.
- Latency is wall-clock per turn from the runner's side. Compare like with
  like: offline numbers are the route on a fake backend.

## Comparing runs

`runs.jsonl` keeps every run; `LATEST.md` compares the newest run per mode
with the most recent earlier run of the same mode that covered the same
sections: regressions (passed before, fail now), fixed, still failing, new
cases, and the change in average cost and latency per turn. A regression in
`bugs` is the same bug coming back; treat it as such.

## Adding cases

- Real data only: every fact a case relies on exists in the test data on the
  day it is written. When a live expectation fails, check the data before the
  code.
- Write the user's words as a person would, typos included. One case, one
  conversation. Say why the case exists.
- Model-dependent wording goes under the live expectations; deterministic
  checks under the offline ones.
- A case that emails, pays, or acts irreversibly never exists.
- Keep ids stable: the history in `runs.jsonl` is keyed by them.

## Harness rules

- **Live runs spend the same provider quotas and rate limits as real users.**
  The runner checks the remaining quota before it starts and refuses to leave
  too little for real users. Never raise a production limit from the suite;
  that is the owner's decision.
- **Runs from one machine share one IP.** Pool test sessions and pace turns so
  the suite never trips the app's own abuse limits for the owner's browser.
