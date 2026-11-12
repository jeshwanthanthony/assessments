# DESIGN.md - the aesthetic contract

Follow this instead of inventing new looks. If you add or change a visual
pattern, update this file in the same commit. Before choosing any font
anywhere, read `docs/FONTS.md`.

## Principles

1. **Professional, high-tech, restrained**: clean whites, hairline borders,
   soft depth. Never "AI-slop" gradients, never a kid's-coloring mix of
   accents.
2. **Black, white and greys, and one accent with one meaning.** Tokens:
   black `#000`, body `#171717`, strong `#404040`, secondary `#737373`,
   tertiary `#a3a3a3`, border `#e5e5e5`, divider `#efefef` (rows `#f2f2f2`),
   card `#f6f6f6`, track `#f5f5f5`, disabled `#d4d4d4`, accent blue
   `#3b82ff`. The accent is used only for the one thing it means; a
   destructive or "end" action is red `#e5484d`. A colour outside these is a
   bug. The focus ring's `#0071e3` stays a system focus colour.
3. **Copy is warm and plain**, not corporate.
4. **Motion is soft and purposeful**: springs and fades under ~450ms
   (`cubic-bezier(.2,.9,.28,1.04)` or `cubic-bezier(.2,.8,.2,1)`), gentle
   pulses for attention, never flashing or bouncing UI. A new list row fades
   in and rises a few px; a row that stays never animates again.
5. **Failures are quiet for end users**: degrade gracefully, log to console.

## App surfaces

- **Where things live**: each tab answers one question and each setting
  lives in ONE place. Before adding a card, put it on the tab whose question
  it answers; never mirror a setting on two tabs.
- **Nothing for show**: a control must change something a user gets. Before
  adding one, trace it to its effect; if a later look overrides it, remove
  the control rather than leave it.
- **One control vocabulary**: every screen uses only the shared classes in
  the main stylesheet: a 36px outline button (one solid primary action per
  form, a 32px small size), a pick-one pill (32px, `aria-pressed` or
  `aria-checked` fills it; hover never restyles the selected one), a
  sentence-case label (never uppercase), an input, ONE intro line per
  section and a help line, hairline list rows (never grey filled bars), a
  small outlined status tag, and a small icon button for row actions. The
  top tabs mark the active one with a bottom rule; a view switch is an
  underline tab row with filters under it. Card titles are sentence case.
  Copy is one short line per section; instructions on how to click things
  are cut. A contrast test proves it.
- **Black is black** (the dark canvas): nothing is filled grey. Panels,
  option cards, inputs and pop-ups are #000 drawn by a 1px hairline (rgba
  white .16 to .2, .5 on hover); selected or primary is solid white. ONE
  switch everywhere: a 40 x 24 pill, off = black with a light outline and a
  grey knob, on = white with a black knob. Tabs carry no filled bar. A
  loading line is centred in its space, never against the left edge. Never
  move a knob with both `translate` and `transform` (a minifier can drop
  `translate: none`; zero it with `translate: 0px 0px`).
- **One type scale per page**: Inter for every line, Inter Tight 400 for
  names; labels 14px / 500, text 13px at 60%, values 14px at 86%, kickers
  11px caps at 50%; amber only to warn. Each section named in Inter Tight
  300 at 28px with one 14px line under it. Editing a detail happens on a
  white sheet (Inter, #1d1d1f on #fff, a black pill Save, a segmented
  choice) over the page.
- **Full-screen surfaces** are drawn in a portal on `<body>` (an enter
  animation's leftover transform traps `position: fixed` children). While
  open, make the rest of the page `inert` except the toast region
  (`aria-modal` alone does not stop Tab). A control that cannot be changed
  is disabled with a label and title that say why.
- **Attention hint**: small muted text gently bobbing above a deliberate
  primary button. Reuse it instead of inventing new attention-grabbers.
- **The one red attention state**: an icon button with
  `data-attention="true"` takes a restrained red OUTLINE, never a red fill,
  for "something needs you here and nothing later fixed it". Colour is
  NEVER the only signal: it also carries an `aria-label` and a `title` that
  say what is wrong and how many. Do not add a second red attention
  affordance; extend this one.
- **Destructive actions**: cancellation of an unfinished setup is a quiet
  neutral pill, not a red primary. Destructive red appears only inside the
  confirmation dialog, beside an equally clear Keep action. The dialog
  names exactly what is removed and blocks repeat clicks while it runs.

### Themes

- Light by default, Dark, or the device's setting (`<html data-theme>`, a
  header button; kept in this browser).
- Every colour written for the dark canvas reads a CSS variable whose
  fallback is the dark value, so Dark is unchanged and Light re-points them
  once: white overlays (lines, tints), the light text family, solid ink
  (type, selected fills), paper (the canvas and type on a selected fill),
  raised panels. A selected or "on" control is solid ink with paper type in
  both themes. New CSS uses the variables, never the raw colour. White
  sheets stay white in both themes.
- Checked in both themes by a contrast script (every text at least 4.5:1).

### Status lines: a dot and plain words

A live status ("Saved", "Offline", "Sharing is off") is a 7 px solid dot
(green, amber or grey) beside plain text in the ink colour, 15 px Inter 500.
No tinted pill background, no glow ring around the dot.

### Settings cards: one status line, grouped rows, quiet actions

An Inter Tight 300 title, ONE status line on the right (the status-line
dot); hairline rows with the label left (Inter 500 13 px, dim) and the value
in Inter 14 px, a row's one action as an underlined text link on the right;
secondary actions as outlined square 36 px buttons in one row (44 px on a
phone), and technical details collapsed behind a quiet "Technical details"
toggle inside the same card. On a phone the label sits above its value. A
card states what is true NOW first and labels a saved-but-not-applied
switch as the saved choice. A raw error is shown only under "Error details
for support". Lists are a table on a PC and stacked cards on a phone.
Choosing something with consequences happens on a white sheet: option
cards 14 px radius, a 20 px radio, the selected card a 1.5 px ink border, an
outlined "Recommended" pill, a line under each option saying what it
changes.

### Section pages: a sub-menu, 1200 px sections, hairlines

A sticky 52 px sub-menu under the app bars, edge to edge, that lights the
section in view; sections 1200 px wide (32 px sides, 16 on a phone) with a
1 px hairline between them; Inter Tight 300 titles at 40 / 30 px; cards
18 px radius; the fade-in once.

## Landing

Cinematic film-system beats (dim-in/dim-out lines), the REAL product as the
demo (never a mock look-alike). Fact tiles are coloured by MEANING, never
decoration: a loss is dark (`#141311` / `#2a201a`) with an ember number
`#ec6a43`; a gain is warm paper (`#f2ede4` / `#ddd3c2`) with an ink number.
Each tile is one number and one line. Never copy another site's look one to
one.

## Don'ts

- No em or en dashes ANYWHERE (copy, UI, emails, docs, comments, commits);
  use a comma, a period, or a spaced hyphen. Ranges use a hyphen (5-10pm).
- No new accent colors, no heavy borders, no hard shadows, no all-caps shouting.
- No glowing dot next to text, anywhere (no accent dot on a button, no orb
  beside a caption or card title). A background dot field is texture, not a
  dot beside text, so it keeps this rule.
- Don't restyle surfaces outside your task's scope; don't "modernize" an
  existing design system wholesale.
