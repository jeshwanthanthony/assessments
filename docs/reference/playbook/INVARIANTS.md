# INVARIANTS.md: rules that must stay true, and the places where small edits do large damage

Rules for AI Native Full Stack Assignment that must hold in every release.
Update when an invariant gains or loses an enforcement point, or when a new
chokepoint appears. Each invariant lists WHERE it is enforced and WHICH TEST
proves it, so a future agent can check rather than trust. Only rules backed
by implementation are listed; a rule without both lines is a goal, not an
invariant.

Format for each entry:

```
N. **The rule, in one sentence.** Enforced: <function / file>. Proven: <test>.
```

## A. Invariants

### Tenancy and identity
1. **Owner APIs derive the owner from the verified token, never from the
   body.** Enforced: TBD. Proven: a route-auth inventory (every route in
   exactly one auth class) and a tenant-isolation test.
2. **Public clients can call no service-only function.** Row-level security
   on with no policy is intentional for service-only tables. Enforced: TBD.
   Proven: an RPC exposure test.
3. **Users cannot change billing or security columns on their own rows.**
   Enforced: column-level update allowlist plus a rejecting trigger. Proven:
   TBD.

### Money and cost
4. **Every gate that can spend money fails CLOSED.** Quotas, budgets and rate
   limits refuse when they cannot decide. Enforced: TBD. Proven: TBD.
5. **No paid provider call runs before the abuse and allowance gates.**
   Enforced: gate order in the request handler. Proven: TBD.
6. **The server decides prices, permissions and identifiers; the client sends
   intent only.** Enforced: TBD. Proven: TBD.
7. **Webhooks are verified and deduplicated.** Enforced: signature check plus
   a unique event claim. Proven: TBD.

### Behavior and truth
8. **One source of truth.** Each fact (a prompt, a config value, a document's
   state) is built in one place; every surface reads it from there. Enforced:
   TBD. Proven: a parity test across surfaces.
9. **Never invent a capability.** No surface may claim a feature the data or
   the code does not support. Enforced: TBD. Proven: TBD.
10. **The app never claims a change the server did not make or see.** The
    text a user reads about a state change is composed from the server's
    result, never from a model's or the client's guess. Enforced: TBD.
    Proven: TBD.
11. **User data is untrusted to the model.** It sits after a marked boundary;
    user instructions can never relax safety. Enforced: TBD. Proven: TBD.
12. **No em dashes and no raw browser errors shown to users.** Proven: TBD.

### Platform
13. **Secrets never ship to the browser.** Only the listed public values are
    public; the build rejects secret-like public names. Proven: a bundle
    secret scan, a repository secret scan, the pre-commit hook.
14. **Unknown `/api/*` paths 404 at the gate.** Enforced: a route-method
    allowlist. Consequence: a route not listed is unreachable. Proven: TBD.
15. **Migrations are additive and applied by hand; a `create or replace`
    re-emits a whole function.** Check the newest body carries every field of
    the previous one before applying. Proven: a test that diffs the field
    lists.
16. **A cached loader never shares an in-flight promise across requests.**
    Cache values only; a request awaiting I/O started by another request can
    be cancelled by the runtime. Proven: TBD.

### Editor (placeholders, fill in as the system is built)
17. **A saved edit is never lost.** Once the server acknowledges an edit, it
    survives reconnects, restarts and deploys. Enforced: TBD. Proven: TBD.
18. **Two users converge to the same document.** After all edits are
    delivered, every client shows identical content. Enforced: TBD. Proven:
    TBD.
19. **A user sees and edits only documents they are permitted to.** The
    server checks access on every read, write and sync message. Enforced:
    TBD. Proven: TBD.

## B. Dangerous areas (small change, large blast radius)

| Area | Why it is dangerous | Before touching |
|---|---|---|
| The API route allowlist | The only thing between the internet and an unlisted route; a missing entry silently 404s a feature, an extra entry without route auth exposes one | Add the route AND its auth class in the route-auth inventory; probe the live URL |
| Auth and session gates in the server entry | One exempt path disables every gate for it | Read `SECURITY.md`; run the auth and remediation suites |
| Request gate order on paid paths | Moving a gate below a paid call spends money on abuse | Run the security and hardening suites |
| Database function re-emissions | `create or replace` drops fields not carried forward; grants must be restated | Diff against the previous body; RPC exposure test; verify live with a read-only query |
| The deploy config generator | Rewrites routes, domains, scheduled jobs and kept variables on every build; a mistake can detach the production domain or wipe dashboard variables | Read its header comments; build and inspect the generated config |
| Per-instance caches and rate maps | Best-effort only on serverless runtimes; anything that must be durable belongs in a database ledger | Prefer a durable quota function |
| Feature flags | Flipping one re-enables dead branches that have not run for weeks | List the dead branches before flipping |
