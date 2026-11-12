# Mistakes ledger: what broke, the exact steps, and the rule that stops it again

## The rules

1. **Every bug found by clicking, by a test, by the owner or by a user gets
   an entry here**, newest first, in the same commit as its fix: the exact
   steps (what was clicked, typed, reloaded, in which order), what broke,
   why, THE FIX, the test that replays those steps, and a "never again"
   line. A bug in an AI turn ALSO gets its THE FIX row in
   `docs/AI_REGRESSION.md` (the two point at each other).
2. **Our own mistakes count too**: a wrong assumption, a test that proved the
   wrong thing, a shortcut that broke something. Same entry, same "never
   again".
3. **Before every push and every deploy**, re-run the replay test of every
   entry whose area the change touches (the "Replay" line), and read the
   "never again" lines of that area first. An entry is never deleted; if its
   test is re-pinned, the entry says so with the date.
4. **The undo for each step is written down.** Where a step changes state (a
   document, a share setting, a stored preference), the entry says what puts
   it back, so whoever replays it by hand leaves nothing behind. Replays never
   touch real users' data: they use mocked APIs or disposable test accounts.

## Entry format

```
### <ID> (<date>, found by <who/how>)
Steps: 1. ... 2. ... 3. ...
Broke: what the user saw.
Why: the cause in the code.
THE FIX: what changed (file:function).
Replay: the test (and section) that runs these steps.
Undo: what resets the state after a manual replay.
Never again: the one rule.
```

## Entries (newest first)

### EXAMPLE-0000-00-00-offline-edit-dropped (example only, delete when the first real entry lands)
Steps: 1. Open a document in two tabs. 2. Put tab A offline and type a sentence. 3. Edit the same paragraph in tab B. 4. Bring tab A back online.
Broke: tab A's sentence disappeared on reconnect.
Why: the client replaced its local state with the server snapshot instead of replaying its pending changes on top.
THE FIX: `sync/client.ts:reconnect` rebases pending local changes onto the server state before rendering.
Replay: `tests/sync/offline-reconnect.test.ts` ("pending edits survive reconnect").
Undo: delete the test document.
Never again: a reconnect never discards a local change the server has not acknowledged.
