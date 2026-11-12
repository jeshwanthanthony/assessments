# Components (map to shadcn/ui)

All sizes in px. "Hover" = background change only, 120ms. Focus = 2px accent outline, 2px offset (`focus-visible:ring-2 ring-accent ring-offset-2`), never removed.

## Button (`ui/button`)
| Variant | Use | Style |
|---|---|---|
| primary | New document, Sign in, Share (in dialog), Import | bg ink #18181b, white text, hover #2b2b31 |
| accent | the editor's Share button only | bg #3451d1, hover #2b44b8 |
| secondary | Import (dashboard), Cancel, Done, Try again | white, 1px border-strong, hover subtle |
| ghost | toolbar-like actions | text-2, hover subtle + text |
Sizes: default 32h, 12px x-padding, 13px/500, radius 6, gap 6, icon 16. `lg` 36h 14px (login). Loading: icon becomes `Loader2` spin, label "Signing in…" / "Importing…", button disabled. Disabled: 50% opacity.

## Icon button
28x28, radius 6, icon 16, text-2, hover subtle. Always has `aria-label`; tooltip where meaning isn't obvious.

## Input (`ui/input`)
36h (32h in search and share), radius 6, 1px border-strong, 10px x-padding, placeholder text-3. Hover border #c6c6c1. Focus border accent + 3px ring accentRing. Error border danger + message under it (12px, danger, `AlertCircle` 14px). Label above: 13px/500, 6px gap.

## Search
280w (full width on mobile), leading `Search` 16 at 10px, input padding-left 32, trailing `/` key hint (11px, bordered chip). `/` focuses it from anywhere on the dashboard.

## Dropdown menu (`ui/dropdown-menu`)
White, 1px border, radius 8, shadow pop, 4px padding, min-width 200. Items 30h, radius 4, 13px, 8px gap, leading icon text-2. Hover/keyboard focus = subtle. Section label 11px/500 text-3. Separator 1px border, 4px margin. Selected item: trailing `Check` in accent. Shortcut hints right-aligned 11px text-3. Opens 4px below the trigger, flips up if no room; 120ms fade+scale from .98.

## Tooltip (`ui/tooltip`)
#1d1d21, white 12px/16px, radius 6, padding 5x8, 6px below the control, shortcut in #a8a8b0 after the label (e.g. "Bold ⌘B"). Delay ~300ms in production. Never shown while a menu is open.

## Dialog (`ui/dialog`)
480 max width, radius 12, 1px border, shadow dialog. Overlay rgba(18,18,22,.32). Top-aligned at 12vh. Header 18/20/0 padding: title 16px/600 display font, subtitle 13px text-2, close `X` icon button top-right. Body 16/20/20. Footer: 1px top border, bg #fbfbfa, 14/20 padding, buttons right-aligned 8 gap. Esc closes, click on overlay closes, focus trapped, focus returns to the trigger.

## Avatar (`ui/avatar`)
Circle, initials (2 letters), white 600, per-user colour from tokens. 24 (rows, topbar), 28 (sidebar user, demo accounts), 32 (share list). Stacks overlap -6 with a 2px white ring.

## Document row
Grid: `minmax(0,1fr) 200px 150px 40px`, 44h, 14px left padding, 1px top border between rows, whole row clickable (Enter opens), hover #fafaf9.
- Name cell: 28px file tile (radius 6) + name 14px/500 ellipsis. Owned = neutral tile with `FileText`; shared-with-me = accent-soft tile with `Users` in accent. Owned docs shared with others show a quiet `Users` + count after the name (12px text-3, tooltip lists names).
- Owner cell: avatar 24 + "You" or the owner's name (text-2).
- Last modified: text-3, tabular numbers. "Just now", "12 min ago", "3 h ago", "Yesterday", then "Nov 6".
- Actions: `MoreHorizontal` icon button → menu: Open, Rename, Share (owner only).
- Rename: name turns into a 28h input in place, text selected; Enter or blur saves, Esc cancels; toast "Document renamed".
Table container: white, 1px border, radius 8. Header row 34h, subtle bg, 12px/500 text-3.

## Formatting toolbar
44h bar, white, 1px bottom border, centred group. Buttons 30x30 (`ui/toggle`), radius 6, icon 16, text-2; hover subtle; active (`aria-pressed=true`) accent-soft bg + accent icon. Groups split by 1x20 dividers with 6px margin: [Undo Redo] | [Text style ▾ 132w] | [B I U] | [Bulleted Numbered]. Text style dropdown shows each option in its own style (Heading 1 at 18px etc.) with shortcut hints. Toolbar buttons use `onMouseDown preventDefault` so the editor keeps its selection.

## Toast (`sonner`)
Bottom-right, 16 from edges (full width on mobile). White, 1px border, radius 8, shadow pop, 10x12 padding, 13px, leading icon (success green `CheckCircle2`, error danger `AlertCircle`), optional text action on the right. 4s, slides up 8px in 200ms. `role=status`.

## Empty state
Centered in the table container, 56 vertical padding. 40px bordered icon tile (radius 8) → title 15px/600 → one sentence 14px text-2 (max 340w) → up to two buttons. Error variant: tile in danger-soft with danger icon.

## Loading skeleton
Same row grid, 5 rows, 10px tall bars (radius 4) shimmering subtle→#e9e9e6 over 1.2s; name bar widths 52/38/60/44/30%. Header row stays. Screen-reader text "Loading documents".

## Save status (editor top bar)
12px, inline icon 14 + label, `aria-live=polite`.
| State | Look |
|---|---|
| Saved | `Cloud` + "Saved", text-3 |
| Unsaved | 6px dot + "Unsaved changes", warning |
| Saving | `Loader2` spin + "Saving…", text-3 |
| Error | `AlertCircle` + "Couldn't save." + underlined "Retry", danger |
On mobile only the icon shows.
