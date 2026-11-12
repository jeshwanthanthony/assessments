# DocSpace UI Handoff

UI/UX design package for DocSpace, a lightweight Google Docs alternative. Design only: no backend.
The main coding agent should read `UI_SPEC.md` first (also delivered as a separate file).

## Contents
| Path | What |
|---|---|
| `UI_SPEC.md` | The implementation spec: every screen, state, flow, token, accessibility rule and API touchpoint |
| `preview/` | Interactive frontend preview (plain HTML/CSS/JS, mock data). The visual source of truth |
| `preview/tokens.css` | Design tokens as CSS variables |
| `preview/styles.css` | All component styles (readable reference for exact values) |
| `preview/app.js` | Preview logic and the mock data / document content to seed |
| `preview/assets/fonts/` | Inter and Inter Tight variable fonts (OFL licence included) for `next/font/local` |
| `preview/assets/logo.svg` | Logo mark and favicon |
| `design/tokens.json` | Tokens as data: colours, type scale, spacing, radii, shadows, sizes, motion, breakpoints |
| `design/tailwind.theme.ts` | `theme.extend` block + shadcn CSS variables |
| `design/components.md` | Reusable component specs mapped to shadcn/ui |
| `design/responsive.md` | Breakpoint behaviour table |
| `design/icons.md` | lucide-react icon map |
| `screenshots/` | 39 PNGs (2x): every screen, modal, state, tablet and phone |

## Run the preview
```
npx http-server preview -p 4810     # then open http://localhost:4810
```
Sign in with a demo account (Maya Chen or Daniel Okafor, password `demo1234`).
Review-only URL flags: `?state=loading`, `?state=empty`, `?state=error` (document lists), `?save=error` (editor save fails).
Anything else (create, open, rename, format, share, import, switch user) works by clicking.

## Direction in one paragraph
Neutral, document-first and quiet: warm off-white workspace (#f7f7f5), white surfaces, 1px borders instead of shadows,
near-black primary buttons and a single restrained blue accent (#3451d1) used only for focus, active formatting,
links and the editor's Share button. Inter for the interface and document body, Inter Tight semibold for titles and
document headings. The editor is a real page (816px, 72/96 margins) on a soft canvas with a slim centred toolbar.

## Out of scope (by design)
Real-time co-editing, live cursors, comments, AI, version history, complex permissions, export, billing, settings, marketing pages.
