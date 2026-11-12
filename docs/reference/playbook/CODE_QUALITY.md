# CODE_QUALITY.md - the bar every change must clear

This file is the bar for AI Native Full Stack Assignment. It binds every
agent (Claude, Codex, anyone) on every change, small or large. `AGENTS.md`
points here. How to choose between designs before the bar applies is
`docs/ENGINEERING_JUDGMENT.md`.

If a change cannot meet a rule, say so in the report and in `docs/HANDOFF.md`
with the reason; never ship around it silently.

## 1. Working, proven, not just written

1. **Done means proven.** A change is done when it is tested at the level it
   can break: a pure function gets a unit test, a UI change gets a browser
   check or a screenshot you actually looked at, a server route gets a test
   of its refusal paths (no session, bad input, over quota) as well as its
   success. Name the suites and their counts in the commit message.
2. **Every reported bug becomes a permanent test** (AI bugs: a case in the
   AI regression suite, `docs/AI_REGRESSION.md`; others: a `[regression]`
   check in the area's suite). Prove the test fails without the fix when it
   is cheap to do so (run it against the previous file).
3. **Re-pin, never delete.** When a change deliberately alters behaviour a
   test pins, rewrite that check to the new rule with a dated comment saying
   who asked and why. Removing a failing check to get green is forbidden.
4. **Run what you touched, plus the deploy gate.** `docs/TESTING.md` maps
   areas to suites. The deploy command runs the gate; never bypass it.
5. **Look at it.** For anything a user sees, take a screenshot (Playwright)
   and read it before saying it works. CSS that "should" work can ship
   broken (a minifier dropping a property, a control drawn outside its box).

## 2. Structure that can be changed later

1. **Pure core, thin edges.** Decisions (parsing, merging, ranking, rules,
   permissions) live in pure functions in `src/lib/**` with no I/O, so they
   can be tested offline and reused by every surface. Routes and components
   only gather inputs, call the pure core and write results.
2. **One source of truth per fact.** A setting lives in one column, one
   module decides it, and every surface reads that module. Never fork a
   second parser or a second copy of a rule.
3. **Small files with one job.** A new concern gets its own module named
   for what it does. Do not grow a large page component with new logic when
   a module can hold it; mount a component or call a function.
4. **Data access behind named functions.** New database reads and writes go
   through a function in `src/lib/**` (or a typed RPC), not scattered inline
   queries, so a storage move (see `docs/DATA_PORTABILITY.md`) changes one
   place. Browser code writes only what row-level security and the column
   allowlist permit.
5. **Additive, reversible changes.** Migrations are additive and applied by
   hand before the deploy. New behaviour that can surprise has a switch or
   a fallback path that keeps the old behaviour working.
6. **Types are documentation.** Export the types a module's callers need;
   no `any` in new code unless a third-party shape forces it, and then
   narrow it at the boundary.
7. **No structure on speculation.** A new layer, pattern or abstraction
   needs one of: it separates a decision from I/O, two real implementations
   exist today, or a bug class has repeated and a type would make the wrong
   state impossible to write. Otherwise write the plain function. "Prefer
   proven patterns" is about copying how successful products behave, not
   about adding design patterns.

## 3. Safe by construction

1. **Fail closed** on money, permissions, quotas and anything an anonymous
   user can trigger. A missing column, a failed read or an unknown value
   degrades to "not allowed" or the old behaviour, never to "allowed".
2. **Validate at every boundary.** Bound lengths, allowlist kinds and
   hosts, re-validate anything a model returns, cap request bodies. Never
   trust the client for price, identity or ownership.
3. **New routes** are registered in the route contract and the route auth
   inventory, carry a quota when they cost money, and get a row in
   `docs/SECURITY_LEDGER.md`.
4. **Logs carry kinds and counts, never content**: no secrets, tokens,
   document text, emails or signed URLs with queries.
5. **Third parties and cost.** Anything that adds a paid call, a new
   provider or a per-user cost is reported to the owner with the cost
   (`docs/SCALING.md`) before or as it ships. Ask before adding a paid
   service.
6. **Unknown is not empty.** A reader tells "not there" from "could not
   read": take the client's `error`, throw a named error or return a result
   that names the failure, and never answer `null`, `[]` or `false` for
   both. Rule 1 (fail closed) is for permissions, prices and quotas. A fact
   shown to a person, and any step that deletes, overwrites or merges,
   treats a failed read as unknown: keep what is there, say it failed,
   retry.
7. **A read is complete or says it is not.** Data APIs cap rows per read.
   Count with an exact head count, page with a range, and never count, sum
   or "delete what is not in the list" over rows downloaded in one unpaged
   read.
8. **A write is decided on the state it changes.** One statement with its
   own condition (`update ... where version = <expected>`, `set n = n + 1`,
   one key of a jsonb), then check a row changed; or an insert judged by a
   unique key. No read, compute in memory, write back on a value two
   requests can share. A database change plus an outside effect records
   the intent first and carries a key that is the same on every retry.
9. **Every call that leaves the server has a time limit**, a retry has a
   maximum and a growing wait, and only a call that is safe to repeat (or
   carries its idempotency key) is retried.
10. **What the model is given says what it is for; what the model claims
    is checked.** Context enters the prompt with its scope, and a claim
    about an action or a promise is confirmed by code or cut.

## 4. Readable by the next agent

1. **Comment the why, with the owner's words and the date.** A short
   header per module and a dated note at each decision ("owner YYYY-MM-DD:
   ..."). Match the surrounding density; do not narrate the obvious.
2. **No em or en dashes** anywhere (code, copy, docs, commit messages).
   Escape them in regexes. A check fails on a literal one.
3. **Names say what a thing is for** (`mergeRemoteEdit`, not `fix2`).
4. **Docs in the same commit**: the subsystem doc, `docs/TESTING.md`,
   `docs/HANDOFF.md` and `AGENT_LOG.md` whenever their "update when" fires.

## 5. The look

1. Fonts only from `docs/FONTS.md`.
2. The visual rules in `DESIGN.md` (one switch, one control vocabulary, a
   shared loading state).
3. Motion is transform and opacity only, respects reduced motion, and never
   animates a clip-path under a filter.
4. Phone width first: no horizontal scroll, 16 px side gutter, tap targets
   of at least 40 px.

## 6. Every customer, every input, every screen

1. **Any customer, any input, any number.** A feature or architectural
   choice must hold for any customer's data, any user input (typos, paste,
   several actions at once), any number of documents, users, sections and
   workspaces, and any environment it runs in. Read what a rule needs from
   the customer's own data or a setting; never from a constant that names
   one customer.
2. **The unavoidable exception is written down.** If something cannot be
   generic (a provider's fixed URL shape, a browser quirk), the comment
   beside it says why and the subsystem doc lists it; it stays data or a
   named default that can be changed, never a branch in the logic.
3. **Proven on more than one shape.** Tests use at least two shapes of data
   (one user and two, an empty document and a large one, a feature present
   and absent) so a rule tuned to one case fails.
4. **Phone and PC.** Every visual, architectural or feature change works on
   both (touch and mouse, phone and desktop widths, Safari and Chrome) and
   is checked at both sizes before it ships.
5. **Smooth motion.** Fades and moves use opacity and transform with a
   short ease, settle once (no blink, jitter, shake, flash or trail), never
   flip on and off between frames (a state change waits until it has held
   for a moment), and respect reduced motion.
6. **Every platform, researched.** Every iOS browser (all WebKit),
   Android's Chrome, Samsung Internet, Firefox and WebViews, Mac and Windows
   browsers, machines without a GPU, down to the support line in
   `docs/PLATFORMS.md`. Check a capability there (or in MDN's compat data or
   the engine's source) before relying on it; follow its rules (shapes by
   moving pieces, glows by opacity, scale down not up, no `!important` on an
   animated property, WebKit's easing rules); the motion test passes; a new
   exception goes in its section 4 with the reason.

## 7. Before you say "done"

- [ ] Typecheck clean.
- [ ] The area's suites green, counts in the commit message.
- [ ] Looked at it (screenshot) if anyone sees it, on a phone AND a PC.
- [ ] Motion or visual change: the motion test green; every capability checked in `docs/PLATFORMS.md`.
- [ ] Works for any customer, input and number of things; no constant names one.
- [ ] A new reader tells "not there" from "could not read"; a new outside call has a time limit; a new write carries its own condition.
- [ ] New route registered, quota'd, in the security ledger.
- [ ] Cost or scale impact told to the owner (`docs/SCALING.md`).
- [ ] Docs updated in the same commit; HANDOFF current; pushed.
- [ ] Deployed through the one deploy command and verified on production.
