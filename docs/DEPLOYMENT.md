# DEPLOYMENT.md: the test, commit, push, deploy loop

How code reaches production for DocSpace. This is the
loop you run every time. One-time launch setup (domain, secrets, provider
registration) lives in its own file. Keep this file true to `package.json`,
the hooks and the CI workflow; when they change, update it in the same commit.

## The shape of it

- Write down here what serves the app (client host, sync server, storage),
  its production name and its scheduled jobs. Pin the deploy target's name in
  config so a plain `npm run deploy` can never create a second, unnamed
  service. Still read the name in the deploy output.
- A deploy must never wipe configuration managed outside the repo (dashboard
  variables): keep that setting explicit in the generated config.
- Per-version public preview URLs that run with production secrets stay off.
- Deploys are MANUAL, from a machine with the local env file and a provider
  login. Nothing deploys on push. CI only validates.
- Deploys come from the working branch named in `HANDOFF.md`.
- Database migrations are NEVER run by a deploy. They are applied by hand,
  verified live, and must be in place BEFORE code that depends on them ships.

## 0. Before you change anything

```bash
git branch --show-current            # must be the branch in HANDOFF.md
git status --short                   # another agent's dirty files? read them first
git fetch origin && git log --oneline origin/$(git branch --show-current)..HEAD   # your unpushed commits
git log --oneline HEAD..origin/$(git branch --show-current)   # pushed by another agent? git pull --ff-only, re-read HANDOFF.md
git log --oneline -8                 # what landed since the handoff was written
git stash list                       # stashes are not yours; leave them
```

Update `HANDOFF.md` section 4 BEFORE any migration or deploy, and commit and
push that update, so a session that dies mid-release leaves the next agent the
exact state (what is applied, what is pushed, what is live).

If the tree is dirty or there are unpushed commits you did not make, that is
unfinished work from another agent. Read the diff, compare with `HANDOFF.md`
section 4, and either finish it deliberately or leave it untouched. Never
`git checkout -- .`, `git reset --hard` or `git stash` someone else's changes
to "start clean".

## 1. Test while you work

The testing doc is the map: "After changing X, run these" names the suites per
area, and "Levels" says what each kind proves. The two rules that matter most:

- Run the EXISTING suites for the area, not only the one you wrote.
- Live production suites that spend a paid budget (AI calls, provider quota)
  run ONCE per deploy. Debug behaviour offline with replayed fixtures instead.

Always, before a commit that touches `src/`:

```bash
npm run typecheck                    # the build does not do this
```

## 2. Commit

- A pre-commit hook blocks staged lines that look like credentials (PEM
  blocks, provider API keys, service tokens). If it fires, remove the secret
  and use an env var; `--no-verify` is for a verified false positive only, and
  CI's full-history scan still runs.
- Never commit env files, build output, provider caches, customer data, user
  documents, screenshots of real users, or agent session exports.
  `.gitignore` covers the first group; the rest is judgement.
- Commit message: what changed and WHY, in plain sentences, no em dashes.
  Mention the deployed version if the commit records a deploy. Update the docs
  in the SAME commit.

## 3. Push

```bash
git push -u origin <branch>
```

Pushing runs the security workflow: dependency audit (high severity is the
gate), security tests, typecheck, security lint, a build with the public
values only, the repository and bundle secret scans, and an SBOM. CI holds no
production secrets and never deploys. A red CI run means the gate would also
fail locally; fix it before deploying.

## 4. Migrations (only when the change has one)

1. Add a NEW timestamped migration file; never edit an applied one
   (additive, re-emit whole functions, re-state grants, deny-all row security
   is intentional).
2. Apply it by hand.
3. Verify with a read-only query that what you meant is what landed, in
   particular grants: database default privileges can hand public roles full
   access to every new table unless you revoke it.
4. Run the exposure test after any schema or RPC change.
5. Record it in the database doc and mark it APPLIED in the current state doc.

Order matters: a deploy that reads a column the migration has not created is
an outage. Migration first, verify, then deploy.

## DocSpace specifics (read before the generic loop below)

- Host: Netlify site `docspace-ajaia` (https://docspace-ajaia.netlify.app), built by
  `@netlify/plugin-nextjs` (declared in `netlify.toml`; an upload deploy does NOT
  auto-detect it, see docs/MISTAKES.md). Env vars on Netlify: the two
  `NEXT_PUBLIC_SUPABASE_*` names only.
- Database: Supabase project `docspace`. Migrations are applied by hand (SQL editor
  or MCP) and recorded in `supabase/migrations/`.
- Gates before a deploy: `npm run typecheck && npm test && npm run build`, then
  `npm run test:rls`, and `npm run test:e2e` + `npm run test:ui` against `next start`.
- After a deploy: `BASE=https://docspace-ajaia.netlify.app npm run test:e2e` and
  `npm run test:ui` with the same BASE. Both must print "All ... passed".
- The generic steps below that name `predeploy`, `lint:security` or
  `test:rpc-exposure` describe the target shape; this repo's gate is the list above.

## 5. Deploy

From the repo root, on the working branch, with a clean tree that is not
behind origin (a deploy builds YOUR tree; deploying from a stale one silently
removes whatever another agent already shipped):

```bash
git fetch origin && git status -sb    # must not say [behind N]; if it does: git pull --ff-only
npm run deploy
```

`npm run deploy` runs `predeploy` first and stops on the first failure:

`typecheck` -> `lint:security` -> `test:security` -> `build` ->
`test:rpc-exposure` -> `test:bundle-secrets` -> `test:repo-secrets` -> deploy

If a suite scans the previous build's output and a build was interrupted, the
deploy stops early on an empty bundle. That is not a code failure: build
again, then deploy again. Deploy when the machine is not under heavy load.

The build refuses to run if required public config is missing, if any public
(browser-exposed) variable name looks like a secret, if a public key is
defined twice with different values, or if a raw variable name leaked into an
asset.

When the owner asks for "the pull command", it is ONE line:

```bash
git checkout <branch> && git pull origin <branch> && npm ci && npm run deploy
```

Do NOT:
- run the provider's deploy command alone (skips every gate, including typecheck);
- deploy from a clone without the env file;
- deploy code whose migration is not yet applied and verified;
- add or change production secrets or vars unless the task is exactly that,
  and then by NAME through the provider CLI, never by pasting a value into
  chat, a doc or a commit;
- raise any cost control.

## 6. Verify on production (never skip; a 200 is not proof)

The deploy prints a version id. Then, read-only:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://<prod-host>/            # 200
curl -s -o /dev/null -w "%{http_code}\n" https://<prod-host>/api/health  # 200
curl -s "https://<prod-host>/<changed-asset>?cb=$(date +%s)" | grep -c "<a marker your change added>"
curl -s -o /dev/null -w "%{http_code}\n" https://<prod-host>/api/<new-owner-route>   # 401 or 405, never 404
curl -sI https://<prod-host>/ | grep -i -E "content-security-policy|permissions-policy"
```

Then run the live third-party check: it loads the real production pages in a
browser and fails on any request to a host the cookie page does not allow,
which catches scripts the platform adds on the way out. It is a production
check, not a deploy gate: a failure means a promise in the privacy policy is
untrue, so fix it or record it in the compliance ledger.

For a client change, the strongest check is to download the served asset and
run the change's browser suite against THAT file. A 404 on a brand-new route
in the first seconds after a deploy is edge propagation; retry before calling
it a bug.

Then record it: the deployed version and what was verified go in the current
state doc, `AGENT_LOG.md`, and `HANDOFF.md` section 2. Commit and push that
record too.

## 7. Rollback

The unit of rollback is a git commit; migrations are additive and a code
rollback runs safely against a newer schema.

```bash
git log --oneline -10                # find the last-known-good commit
git checkout <good-sha>              # or revert forward with a new commit
npm run deploy                       # full gate, then deploy
```

Prefer fixing forward when the fix is small and testable; a rollback that
skips the gate is worse than the bug.

## 8. Secrets and configuration

- The env doc lists every variable and the env-file rules. `.env.example`
  holds placeholders only. Local env files are git-ignored and stay that way.
- Runtime secrets live in the hosting provider's secret store. List NAMES only.
  Values cannot be read back, and must never be written anywhere in this repo,
  in a doc, or in a chat reply.
- Credentials used by MCP tools are the owner's; an agent uses them for the
  task at hand and does not export, list or copy them.
