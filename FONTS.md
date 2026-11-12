# FONTS.md - the owner's type taste (read before choosing ANY font)

The owner has a sharp eye for type and has rejected fonts on sight. This file
is the ledger: what the owner liked, what the owner hated, with the date and
the exact place, so no agent ever ships a rejected look again. Read it before
you pick a typeface, a weight, a size or a caption style for anything a user
will see (landing, app, videos, emails).

**Rules**

1. Only use a combination listed under "Liked". If nothing listed fits, pick
   the closest liked one and say so in your report; never invent a new face.
2. Never use anything listed under "Rejected", in any size or weight.
3. Every time the owner reacts to type (praise or complaint), add a dated row
   here in the same commit. A reaction is the source of truth; this file is
   how it is remembered. Keep the owner's own words in the row.
4. Never rely on a font the visitor may not have. `Helvetica Neue` and other
   system faces are not loaded by the site: on Windows they fall back to
   Arial, which the owner rejected. Text that must look right everywhere
   uses a LOADED web font (Inter Tight or Inter, SELF-HOSTED in
   `public/fonts/`). Never add a Google Fonts or other font-CDN URL: nothing
   third-party loads before consent, and a check fails on one. A new family
   means new files in `public/fonts/` (all subsets, the OFL licence beside
   them) and new `@font-face` rules in `fonts.css`.

## Liked

| Where | Font and setting | Why it was liked |
|---|---|---|
| Big statement titles (video, landing hero) | Inter Tight 300, 78 to 108 px, letter-spacing -0.045em, white, warm grey second line | Approved on sight; asked for "that font" again on a new title |
| A name or a ticket title in a video | Inter Tight 300 (68 px echo, 40 px title), -0.04em | Chosen as a name font that "matches the ad" and is not cheap |
| End title with a wordmark | Inter Tight 300 112 px wordmark, Inter Tight 400 tagline, Inter 500 tracked URL, with a brand mark | Replaced a plain centred slide |
| Fact tiles | Light large numbers (300) with one plain line under them | Kept through two passes; only the colours were changed |
| Film caption | Inter Tight 300, about 58 px at a 1280 stage, on a dark band | "i do like that font", asked for it bigger and clearer |
| App page titles | Inter Tight 300 | The owner's standard for app titles (DESIGN.md) |
| App body and controls | Inter for text; Inter Tight 400 (-0.005em to -0.02em) for names, tabs and every button; a location or meta line in Inter 500 11.5 px tracked +0.02em | Asked that names, tabs and buttons all use "the fonts that i like or at least a variation of it" |
| Section names | Inter Tight 300, 28 px, white (were 11 px caps at 50% white) | "each section needs a bigger name, it's hard to see" |

## Rejected

| Where | Font and setting | What the owner said |
|---|---|---|
| Video captions (bottom left) | Inter Tight 500, 26 px, tight tracking, with a boxed label in Inter 600 | "these two fonts in the bottom left is goofy pick a professional" |
| Card captions | `"Helvetica Neue", Helvetica, Arial` (renders as Arial on Windows) | "the text below is like arial and not professional" |
| End title, first version | Centred mark + name + tagline + URL stacked like a slide | "this just looks basic like a powerpoint slide" |
| A panel with mixed type | Five sizes (14.5 / 13 / 12.5 / 12 / 10.5), colours from 50% to 92% white and two faces on one page; text touching the panel's edge | "close to borders weird fonts"; "so many different fonts sizes and colors and [not] uniform at all". Fixed with one inset, Inter in fields and Inter Tight 400 names, 14 / 13 / 11 sizes and three text colours |

## What to reach for

- Big statements, titles, names: **Inter Tight 300** (light), negative
  tracking (-0.03em to -0.045em), white on black, an optional second line in
  warm grey (#a3a29c).
- Captions on video: **Inter Tight 300**, large (about 34 px at 1280 wide),
  -0.025em, white; a small label above it in **Inter 500** 13 px, tracked
  +0.02em, 62% white, with a short hairline, never a box.
- Small UI labels, URLs, counts: **Inter 500**, tracked slightly.
- Never bold-and-tight for captions (that is the rejected "goofy" look).
