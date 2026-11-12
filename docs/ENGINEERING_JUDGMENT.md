# ENGINEERING_JUDGMENT.md - how to decide, before the code

`docs/CODE_QUALITY.md` is the bar (rules a change must clear). This file is
the reasoning to use when the rules run out: which design to pick, how much
structure a problem deserves, and how far to trust a piece of advice. It
draws on software architecture and agent engineering sources (Kleppmann,
Wlaschin, Chiusano and Bjarnason, Hickey, Helland, Fowler, Stripe's
idempotency write-up, the ReAct, MemGPT and Gorilla papers, Huyen,
Anthropic's agent guide), read against this project's own record in
`docs/MISTAKES.md`.

`AGENTS.md` hard rules and `docs/DECISIONS.md` win over anything here. Read
this file before a design choice, a new module, a new reader or writer of
shared state, or a review. It is short on purpose; do not grow it into a
rule list. A new lesson goes in `docs/MISTAKES.md`; it earns a line here only
when it changes how a whole class of decisions is made.

## 1. How much to trust a piece of advice

Weigh evidence in this order. A lower tier never overrides a higher one.

1. **Our own incidents.** A failure measured on this system, with its replay
   test (`docs/MISTAKES.md`, `docs/AI_REGRESSION.md`).
2. **The provider's reference plus a recorded real answer.** A database, an
   AI provider, a browser engine. Prose about how a provider behaves is a
   hypothesis until a recorded response shows it.
3. **Results that many independent sources reach and that follow from how
   the machine works.** Weak isolation anomalies, retries duplicating a
   non-idempotent call, a pure function being easier to test than one that
   does I/O.
4. **One paper or one vendor benchmark.** True for its models, data and
   year. Use the mechanism it found, never its numbers.
5. **Taste.** File layout, naming, thresholds. Follow the repo's existing
   choice.

## 2. Eight questions, in order

Scale the effort: a one-line fix answers 1, 3 and 8 in a sentence; a change
to money, shared state, the prompt or a provider call answers all eight.

**1. What must stay true?** State the invariant in one sentence before
writing code ("a saved edit is never lost", "a user never sees a document
they were not shared"), and name who reads and who writes the fact. Most
bugs are an invariant nobody had written down.

**2. Can this code tell "no" from "I could not find out"?** A reader has
three outcomes: found, not there, could not read. A design that returns
`null`, `[]` or `false` for the last two has the bug built in, however
careful the caller is. Throw a named error or return a result that names
the failure. With a database client, always take `error`; `data === null`
alone means nothing. Then decide by what the answer is for:
- a permission, a price, a quota: fail closed (CODE_QUALITY 3.1);
- a fact shown to a person, or a step that deletes, overwrites or merges:
  "unknown". Keep what is there, say it failed, try again.
Expected business outcomes, provider and network failures, and defects are
three different things and must not share a return value.

**3. Who else reads or writes this?** A rule lives in one function and
every surface calls it: every client, the single control and the bulk
control, every writer of a column. Before changing a rule or a status, grep
its readers and writers and change them in the same commit, or do not read
the field at all.

**4. Is the decision made on the state it changes?** Postgres runs at Read
Committed and the server handles many requests at once, so anything read a
moment ago is the past: a row, a webhook body, a cached document, a tool
result, another tab's copy. Therefore:
- change state with one statement that carries its own condition
  (`update ... where version = <expected>`, `set n = n + 1`, a `jsonb_set`
  of one key), and check that it changed a row. Never read, compute in
  memory and write back a value two requests can share;
- "does it exist, then insert" needs a unique key as the judge. Claim
  first with an insert on that key, then act. A `select ... for update` of
  a row that does not exist yet locks nothing;
- a database change plus an outside effect (an email, a provider call) is
  written as intent first and effect after (an inbox and outbox), with
  something that finds the ones left half done. Delivery is at least once,
  so the effect carries a key that is the same on every retry of the same
  intent, computed by the server;
- a yes, a lease or a dedupe marker is about one exact state, and is
  checked again right before the step that cannot be undone.

**5. Is everything that crosses a boundary bounded and checked?**
- A read is complete or says it is not: count with a head count, page with
  a range, and size a page by bytes against the statement time limit.
- Every call that leaves the server has a time limit. A retry has a
  maximum, a growing wait, and is used only on a call that is safe to
  repeat or carries its key.
- No input never means no limit; an unset deadline has a safe default.
- What a provider or a model returns is outside data: check its shape
  before using it, and check it again after every pass that rewrites it.
- What goes into the prompt has a size cap and says what it is for. A fact
  handed to the model with no stated purpose will be used for any purpose.
  Retrieved text that does not answer the question can make the answer
  worse, not only longer (tier 4: a reason to measure retrieval).

**6. Who is allowed to say it happened?** Only code that did the thing, or
read the provider's own record of it, says "saved", "sent", "shared". The
model writes the wording; anything it claims about an action or a promise
is checked by code or cut. A step the user cannot undo in one tap runs on
what was filed and confirmed, never on a keyword.

**7. What is the simplest shape that keeps the invariant?** Simple means
few things braided together, not few lines and not what is quickest to
type. Add structure only when one of these is true:
- it separates a decision from I/O, so the decision is a pure function
  that takes its inputs, the clock and any ids as arguments;
- two real implementations exist today;
- a bug class has repeated and a type would make the wrong state
  impossible to write: a tagged union per lifecycle state in place of a
  set of flags and optional fields, a three-outcome reader, a non-empty
  list, a provider's shape translated to ours in one place at the edge.
Otherwise write the plain function, the lookup table, the one indexed
query. No factory, registry, event bus, second service or agent hierarchy
for a single use. Use these types for new state machines and new readers;
do not retrofit working code to them (section 5).

**8. What would prove it, and would that proof fail if the code were
wrong?** Test at the level the thing can break. Run the new test once
against the old code, or with the guard removed, and watch it fail. A race
test builds the overlap it claims before it asserts the outcome. A claim
guard is tested on the false sentence and on the true sentence it must
leave alone. For a parser, a normalizer, a merge or any pass that should be
safe to run twice, check a law over many generated inputs (decode of
encode is the input; applying it twice equals applying it once; two
replicas given the same operations converge) as well as examples. When an
answer comes out of several stages, find the stage first with a per-request
trace of what each stage received and produced.

## 3. What the research recommends and we do not adopt

Each has the condition that would reopen it. Until then, proposing one of
these is a design change for the owner, not a refactor.

| Recommendation | Why not here | Reopen when |
|---|---|---|
| A `Result` type with `bind` and `map` chains for every failure | Tagged unions with early returns say the same thing and read better in TypeScript | never as a rewrite; a new module may use whatever its neighbours use |
| A distinct wrapped type for every id and number | Ceremony across many call sites for bugs we have not had | two kinds of id are confused in a real incident; then brand those two |
| Splitting into services | One app server and one database until the limits in `docs/SCALING.md` say otherwise | a part needs its own scaling or isolation and the measured number says so |
| Several agents with a supervisor | Many times the tokens and far harder to debug | a task truly has independent parallel parts and a budget; even then, off the user's request path |
| Paging the model's context in and out, fixed thresholds | Thresholds come from older models | calls or sessions become long enough that measured answers degrade |
| Checking generated code against a syntax tree | We do not ship model-written code to production paths | never, unless that changes |

## 4. Cautions about research reports

- Numbers from single studies on older models: use the mechanism, not the
  number (tier 4).
- An idempotency example that looks the key up with `select ... for update`
  before inserting it is wrong: on a first request there is no row to lock,
  so two requests both run. Claim with an insert on the unique key first.
- Code samples in reports are often not run (a float used for money, a
  broken template string). Take the idea, never the sample.

## 5. Applying this to code that already works

A principle is a reason to look, never by itself a reason to change.

- Change working code only for a confirmed failure: concrete inputs or
  timing that produce a wrong result, written down, with a test that fails
  before the fix. Keep the fix to the lines that are wrong.
- Everything else found in a review is written down with its trigger and
  its cost (`docs/LEGACY_AND_DEBT.md`, or `docs/SCALING.md` when it is a
  load limit), and left alone.
- Odd-looking code is usually a dated fix for a real incident. Read the
  comment and the ledger entry before judging it.

If a question above does not change the decision in front of you, skip it.
