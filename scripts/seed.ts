// Seeds the six demo documents from UI_SPEC section 9, acting as each demo user (so RLS applies).
// Idempotent: a user's existing document with the same title is left alone.
// Run: npm run seed   (reads NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY from .env.local)
import { readFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { markdownToDoc } from "../src/lib/core/doc";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = /^([A-Z_]+)=(.*)$/.exec(line.trim());
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const PW = "demo1234";

const DOCS: { title: string; owner: string; share: string[]; md: string }[] = [
  { title: "Q4 Product Roadmap", owner: "maya", share: ["daniel"], md: `# Q4 Product Roadmap

This quarter we focus on three outcomes: faster onboarding, reliable sharing, and a better writing experience. Everything below ties back to one of them.

## Goals

1. Cut time-to-first-document from 4 minutes to under 1 minute.
2. Reach 99.9% successful saves across all documents.
3. Ship text import so teams can bring existing notes.

## Milestones

- **October:** new editor toolbar and keyboard shortcuts.
- **November:** sharing by email with owner and editor roles.
- **December:** .txt import and a refreshed dashboard.

### Open questions

Do we need *view-only* access this quarter, or can it wait until Q1? <u>Decision needed by October 20.</u>` },
  { title: "Engineering Team Meeting Notes", owner: "daniel", share: ["maya"], md: `# Engineering Team Meeting Notes

**Date:** Tuesday, November 10 · **Attendees:** Daniel, Maya, Priya

## Updates

- Autosave now debounces at 800 ms; error rate is down to 0.2%.
- Import handles files up to 1 MB; larger files show a clear error.

## Action items

1. Daniel: add retry with backoff for failed saves.
2. Maya: review the sharing dialog copy.
3. Priya: write tests for the import parser.` },
  { title: "Customer Research Summary", owner: "maya", share: [], md: `# Customer Research Summary

We interviewed 14 teams between September and October. Most write first drafts alone and share once the structure is clear.

## Key findings

- Teams want sharing to be **one step**: type an email, done.
- Formatting needs are modest: headings, lists, bold and italic cover 90% of use.
- Lost work is the top fear. A visible save status builds trust.` },
  { title: "Project Launch Checklist", owner: "priya", share: ["maya", "daniel"], md: `# Project Launch Checklist

## Before launch

1. Confirm the demo accounts work end to end.
2. Run the import flow with a 900 KB file.
3. Check keyboard navigation on every screen.

## Launch day

- Post the announcement in #general.
- Watch save error rates for the first two hours.` },
  { title: "Design System Guidelines", owner: "maya", share: ["priya"], md: `# Design System Guidelines

One accent color, neutral surfaces, and 1px borders. Shadows are reserved for floating layers such as menus and dialogs.

## Typography

- Interface text: Inter 14px.
- Document body: Inter 16px with a 1.7 line height.
- Headings: Inter Tight, semibold, tight tracking.` },
  { title: "Hiring Plan: Platform Team", owner: "daniel", share: [], md: `# Hiring Plan: Platform Team

Two senior engineers in Q1.` },
];

async function as(user: string): Promise<SupabaseClient> {
  const sb = createClient(URL, KEY, { auth: { persistSession: false } });
  const { error } = await sb.auth.signInWithPassword({ email: `${user}@docspace.dev`, password: PW });
  if (error) throw new Error(`sign in ${user}: ${error.message}`);
  return sb;
}

async function main() {
  for (const d of DOCS) {
    const sb = await as(d.owner);
    const { data: me } = await sb.auth.getUser();
    const { data: existing } = await sb.from("documents").select("id").eq("owner_id", me.user!.id).eq("title", d.title).maybeSingle();
    let id = existing?.id as string | undefined;
    if (!id) {
      const { data, error } = await sb.from("documents").insert({ owner_id: me.user!.id, title: d.title, content: markdownToDoc(d.md) }).select("id").single();
      if (error) throw error;
      id = data.id;
    }
    for (const who of d.share) {
      const { data, error } = await sb.rpc("share_document", { p_doc: id, p_email: `${who}@docspace.dev`, p_role: "editor" });
      if (error) throw error;
      if (!["ok", "already_shared"].includes(data.status)) throw new Error(`share ${d.title} -> ${who}: ${data.status}`);
    }
    console.log(`${existing ? "kept " : "added"}  ${d.title}  (${d.owner}${d.share.length ? ` -> ${d.share.join(", ")}` : ""})`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
