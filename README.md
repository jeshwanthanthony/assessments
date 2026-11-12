# DocSpace

A lightweight collaborative document editor, built for the Ajaia AI-Native Full Stack Developer assessment.

**Live app:** https://docspace-ajaia.netlify.app (nothing to install)

## Test accounts

| Email | Password |
|---|---|
| maya@docspace.dev | demo1234 |
| daniel@docspace.dev | demo1234 |
| priya@docspace.dev | demo1234 |

On the sign-in page you can click Maya or Daniel to sign in, or create your own account. A new password needs 8+ characters, with an uppercase letter, a lowercase letter, a number and a symbol.

## Try it in two minutes

1. Sign in as **Maya**. Click **New document**, type, and format with the toolbar. It saves automatically.
2. Click **Share**, enter `daniel@docspace.dev`, and pick Editor, Commenter or Viewer.
3. Account menu (bottom left), then **Add another account**, and sign in as **Daniel** in a second tab. Open the same document in both tabs to see each other's cursors live.
4. Also try: **Import** a .txt or .md file; select text and comment on it; open **Version history**; use **Export** to save as Markdown or PDF.

## Run it locally

Needs Node.js 20.19 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open http://localhost:3000.

`.env.local` needs two public values from a Supabase project: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

To use your own Supabase project instead of the hosted one:
1. Run the SQL files in `supabase/migrations/`.
2. Run `scripts/seed-users.sql`.
3. Run `npm run seed`.

## Tests

```bash
npm test             # unit tests (offline)
npm run test:rls     # database permission checks
npm run test:e2e     # API end-to-end (needs the app running)
npm run test:ui      # browser tests, desktop and phone (needs the app running)
```

## More

- [Architecture note](docs/ARCHITECTURE.md)
- [AI workflow note](docs/AI_WORKFLOW.md)
- [Full guide](docs/GUIDE.md)
- [Original brief and design handoff](docs/reference/)
