# DocSpace

A lightweight collaborative document editor, built for the Ajaia AI-Native Full Stack Developer assessment.

**Live:** https://docspace-ajaia.netlify.app

Sign in with a sample account (`maya@docspace.dev` / `demo1234`, or `daniel@docspace.dev` / `demo1234`) or create your own.

## Features

- Create, rename and edit rich-text documents (bold, italic, underline, headings, lists), with autosave
- Import `.txt` / `.md` files (up to 1 MB); export to Markdown or PDF
- Share by email as Editor, Commenter or Viewer
- Comments with replies, version history with restore
- Live collaboration: who is in the document, everyone's cursor and selection with their name, and shared documents appearing instantly
- Several accounts per browser, a different one per tab

## Stack

Next.js · TypeScript · Tiptap · Supabase (auth, Postgres, row-level security, Realtime) · Netlify

## Run locally

```bash
npm install
cp .env.example .env.local   # add your Supabase URL and publishable key
npm run dev
```

## Tests

```bash
npm test             # unit
npm run test:rls     # database permissions (live)
npm run test:e2e     # API end to end (needs a running app)
npm run test:ui      # browser, desktop and phone (needs a running app)
```

## Docs

- [Full guide](docs/GUIDE.md): setup, features, tests
- [Architecture note](docs/ARCHITECTURE.md)
- [AI workflow note](docs/AI_WORKFLOW.md)
- [Original brief and design handoff](docs/reference/)
