# DocSpace UI Spec (for the main coding agent)

Build the UI exactly as described here and shown in `DocSpace_UI_Handoff.zip`. Stack: Next.js (App Router), TypeScript, Tailwind, shadcn/ui, lucide-react, Tiptap. When this file and a screenshot disagree, this file wins.

- **Visual reference:** `preview/index.html`. Run `npx http-server preview`, then sign in with a demo account. Every state in the screenshots can be reproduced there (list states via `?state=loading|empty|error`, save failure via `?save=error`). The editor's open-doc loading and not-found states are spec-only (4.5).
- **Screenshots:** `screenshots/NN-*.png`, cited below as [NN].
- **Values:** `design/tokens.json` and `design/tailwind.theme.ts`.
- **Component details:** `design/components.md`.
- **Breakpoints:** `design/responsive.md`.
- **Icons:** `design/icons.md`.

**Out of scope, so do not build:** real-time co-editing, cursors, comments, AI, version history, roles beyond owner/editor, export, billing, settings, a marketing page.

---

## 1. Principles
1. **Functional, not marketing.** No gradients, illustrations, big cards or hero sections.
2. **Borders over shadows.** Shadows appear only on floating layers (menus, dialogs, toasts) and the document page.
3. **One accent, #3451d1.** It is used only for:
   - the editor's Share button;
   - active toolbar buttons;
   - focus rings;
   - links;
   - the shared-doc file tile;
   - the selected menu check.
   Primary buttons elsewhere are near-black.
4. **Every interactive element has these states:** hover, active, focus-visible and disabled.

## 2. Tokens (summary, full list in `design/tokens.json`)

**Colours**

| Token | Value | Token | Value |
|---|---|---|---|
| bg | #f7f7f5 | text | #18181b |
| surface | #ffffff | text-2 | #5f5f66 |
| subtle (hover) | #f2f2f0 | text-3 | #6f6f76 |
| muted (selected) | #ebebe8 | accent / hover / soft | #3451d1 / #2b44b8 / #eef1fd |
| border | #e6e6e3 | success / soft | #1a7a43 / #e8f5ee |
| border-strong | #d6d6d2 | warning / soft | #a15c07 / #fdf3e1 |
| | | danger / soft | #c4352b / #fdeceb |

**Fonts:** self-host Inter and Inter Tight with `next/font/local`. The files are in `preview/assets/fonts/`, licensed OFL.
- **Inter:** all interface text and the document body.
- **Inter Tight 600:** page titles, dialog titles and document headings.

**Type scale (px, size/line-height weight)**

| Style | Font | Size and weight |
|---|---|---|
| Page title | Inter Tight | 22/28 600, -0.02em |
| Dialog title | Inter Tight | 16/22 600 |
| Body | Inter | 14/20 400 |
| Label | Inter | 13/18 500 |
| Small | Inter | 12/16 |
| Doc body | Inter | 16/1.7, colour #1f1f23 |
| Doc H1 | Inter Tight | 30/1.25 600, -0.025em, margin 32 0 12 |
| Doc H2 | Inter Tight | 22/1.3 600, -0.02em, margin 28 0 8 |
| Doc H3 | Inter Tight | 17/1.4 600, margin 22 0 6 |
| Doc paragraph | | margin-bottom 12 |
| Doc lists | | 24 indent, 2px item gap, markers in text-3 |

**Spacing:** 4px base (4, 8, 12, 16, 20, 24, 32, 40). **Radii:** 4, 6 (controls), 8 (tables, menus, toasts), 12 (dialogs).

**Sizes**

| Element | Size |
|---|---|
| Button / input | 32 / 36 |
| Icon button | 28 |
| Toolbar button | 30 |
| Sidebar | 240 |
| Top bar | 52 |
| Format bar | 44 |
| Table row | 44 (header 34) |
| Page | 816 wide, padding 72/96, min-height 1056 |
| Dialog | 480 |

**Motion:** 120ms hover, 160ms dialog, ease `cubic-bezier(.2,.8,.2,1)`. Respect `prefers-reduced-motion` with no animation.

## 3. Routes and layout
| Route | Screen | Layout |
|---|---|---|
| `/login` | Login | Centred, no shell |
| `/` (`/documents`) | My documents | App shell (sidebar + main) |
| `/shared` | Shared with me | App shell, same table component |
| `/doc/[id]` | Editor | Full screen: top bar + format bar + canvas, no sidebar |
| (modal) | Share dialog | Over the editor or the dashboard |
| (modal) | Import dialog | Over the dashboard |

**App shell:** a sidebar (white, 1px right border, 12/10 padding) and a scrolling main area with bg #f7f7f5. Main content is max 1040 wide, centred, padding 32/40.

## 4. Screens

### 4.1 Login [01] [02] [03] [34]
- **Layout:** a 360w column centred both ways on bg.
- **Content, top to bottom:**
  - logo + "DocSpace" (17px Inter Tight 600), 28 below;
  - H1 "Sign in to DocSpace" 22/28;
  - sub "Write, share and import documents." text-2, 24 below;
  - an error alert (only when invalid);
  - Email field;
  - Password field;
  - "Sign in" primary `lg` button, full width.
- **Fields:** labels 13/500, inputs 36h, 14 gap.
- **Demo accounts:** a divider reading "Demo accounts for reviewers" (12px text-3, with lines), then two rows of 8/10 padding, 1px border, radius 8. Each row has a 28 avatar, the name 13/500, "email · demo1234" 12px text-3, and a trailing `ArrowUpRight`. Clicking one fills both fields and submits.
- **Footer:** "Mock sign-in for the assessment preview." 12px text-3.
- **Loading [02]:** the button is disabled, shows a spinner and reads "Signing in…". Fields stay editable.
- **Invalid [03]:** a danger alert above the form: "That email and password don't match. Try again or use a demo account below." Both inputs get the error border and the email value is kept. The alert has `role=alert`.
- **Focus:** Email is focused on load. Enter submits.
- **Backend:** `POST /api/auth/login {email,password}` returns 200 with the user, or 401. Redirect to `/`.

### 4.2 Sidebar (all app-shell screens) [04] [07]
**Top to bottom:**
1. **Brand row:** logo 22 + "DocSpace" 15px Inter Tight 600, padding 6/8/14.
2. **"New document":** primary, full width, 12 below.
3. **Nav items:** 30h, radius 6, 13/500, icon 16, gap 8, text-2.
   - Hover: subtle + text. Active: muted bg + text, with `aria-current=page`.
   - My documents (`FileText`), with its count right-aligned in 12px text-3, tabular figures.
   - Shared with me (`Users`), with its count.
   - Import file (`Upload`), which opens the import dialog.
4. **Spacer.**
5. **Account button:** avatar 28 + name 13/500 + email 12px text-3 + `ChevronsUpDown`. It opens a menu [07]:
   - header "Switch demo account";
   - the two demo users, with a `Check` on the current one; switching shows a toast "Switched to {name}" and reloads the lists;
   - separator;
   - "Sign out".

### 4.3 My documents [04] [05] [06] [08]
- **Head:** H1 "My documents" + sub "Documents you own. Share any of them by email." On the right, "Import" (secondary) and "New document" (primary).
- **Toolbar row:** a search field (280) on the left and "N documents" (12px text-3) on the right.
  - Search filters by title as you type (client-side over the loaded list).
  - `/` focuses search.
  - No match [08]: an empty state with `Search`, the title "No documents match "{q}"", and "Try a different word, or clear the search."
- **Table:** document rows sorted by updatedAt descending. Full spec in components.md, "Document row".
- **Owned docs shared with others:** after the name, `Users` + count (12px text-3). Hovering shows "Shared with Daniel Okafor".
- **Row click / Enter:** opens `/doc/[id]`.
- **Row menu [05]:**
  - Open, Rename, Share. Share appears for the owner only.
  - Rename [06] edits the name in place: Enter or blur saves, Esc cancels, then a toast "Document renamed".
- **New document:** creates "Untitled document" and goes to the editor with the title selected.
- **States:**
  - **Loading [10-loading]:** skeleton rows.
  - **Empty [10-empty]:** `FileText` tile, "No documents yet", "Create a blank document or import a .txt file to get started.", plus [Import .txt] and [New document].
  - **Error [10-error]:** a danger tile `AlertTriangle`, "Couldn't load your documents", "Check your connection and try again. Nothing you wrote is lost.", plus [Try again] (secondary, `RefreshCw`), which re-fetches and shows the skeleton meanwhile.
- **Backend:** `GET /api/documents?scope=owned` returns `[{id,title,ownerId,updatedAt,sharedWith:[userId]}]`. `POST /api/documents` returns the new doc. `PATCH /api/documents/:id {title}`.

### 4.4 Shared with me [09] [11]
- **Same component as 4.3**, with the title "Shared with me" and the sub "Documents other people have shared with you. You can open and edit them."
- **Differences that make shared docs obvious:**
  - the file tile is accent-soft with an accent `Users` icon;
  - the Owner column shows the owner's avatar and name;
  - the row menu has no Share.
- **Empty [11]:** `Users` tile, "Nothing shared with you yet", "When a teammate shares a document with {email}, it shows up here." No buttons.
- **Backend:** `GET /api/documents?scope=shared`.

### 4.5 Editor (hero) [12]–[19] [25] [30] [33] [36]
**Full screen, no sidebar.** Top to bottom:

**Top bar** (52h, white, bottom border, 12 x-padding, 8 gap):
- **Back:** a `ArrowLeft` icon button, tooltip "Back to documents". It returns to `/` for owned docs and `/shared` otherwise.
- **Title input:**
  - 15/20 600, 30h, borderless until hover (1px border) or focus (accent border + ring), max 420w with ellipsis;
  - typing renames and triggers autosave;
  - Enter moves focus into the document;
  - an empty title on blur becomes "Untitled document".
- **Save status:** see the table below.
- **Spacer.**
- **Owner pill:** on shared docs only, a 24h subtle pill with avatar + "Owned by {name}" [25].
- **Share:** an `accent` button with `UserPlus`.
- **Avatar:** your 24 avatar, which opens a menu with your email header, My documents, and Sign out.

**Format bar** (44h, white, bottom border, centred) [13] [14] [15]:
- **Order:** Undo, Redo | Text style dropdown (132w: "Paragraph / Heading 1 / Heading 2 / Heading 3") | Bold, Italic, Underline | Bulleted list, Numbered list.
- **Tooltips** show a shortcut: Undo ⌘Z, Redo ⌘⇧Z, Bold ⌘B, Italic ⌘I, Underline ⌘U, Bulleted ⌘⇧8, Numbered ⌘⇧7, headings ⌘⌥1–3, paragraph ⌘⌥0.
- **Active state:** follows the selection, using Tiptap `editor.isActive(...)`. Active = accent-soft bg + accent icon, with `aria-pressed`. The dropdown label shows the current block type. Undo/Redo are disabled when `!editor.can().undo()` (35% opacity).
- **Text style dropdown [15]:** shows each option styled at its size, with a check on the current one and shortcut hints.

**Canvas** (flex-1, scrolls, bg #f7f7f5, padding 40/24/120):
- **Page:** white, max 816, min-height 1056, radius 4, `shadow-page` (a 1px border ring + a faint drop), padding 72/96.
- **Tiptap:** `EditorContent` inside the page, with no inner border.
- **Placeholder:** "Start writing…" in text-3 (Placeholder extension).
- **Selection colour:** #d7defa.
- **Extensions:** StarterKit (headings 1–3, bullet/ordered list, history), Underline, Placeholder. No other marks or blocks.

**Save status** (left of the spacer, `aria-live=polite`):

| State | When | Look |
|---|---|---|
| Saved [18] | Initial, and after a successful save | `Cloud` 14 + "Saved", text-3 |
| Unsaved [16] | On any edit, until the debounce fires | 6px dot + "Unsaved changes", warning #a15c07 |
| Saving [17] | Request in flight | `Loader2` spin + "Saving…", text-3 |
| Error [19] | Request failed | `AlertCircle` + "Couldn't save." + underlined "Retry" button, danger |

- **Autosave:** debounce 800ms after the last change (content or title), then `PATCH /api/documents/:id {title?, content}`. Send `content` as Tiptap JSON.
- **On error:** keep the local content, show the Error state, and retry on "Retry". Optionally retry once automatically after 5s.
- **On a successful retry:** a toast "All changes saved".
- **Leaving with unsaved changes or an error:** `beforeunload` warns.
- **Opening a doc:** `GET /api/documents/:id` returns `{id,title,content,ownerId,sharedWith,updatedAt}`.
  - While loading: show the top bar with a 160w title skeleton and an empty page with three skeleton lines.
  - 404/403: a centred empty state, "This document isn't available. It may have been deleted, or you don't have access." with [Back to documents].

**Owner vs editor:** both can edit. Editors see the Share dialog read-only (4.6).

### 4.6 Share dialog [20]–[24] [37]
- **Header:** title "Share "{doc title}"" and sub "People you add can open and edit this document." Close `X`.
- **Owner view [20]:**
  - an invite row: email input (32h, placeholder "Add people by email", autofocus) + primary "Share" button; Enter submits;
  - under it, "People with access" (12px/500 text-3);
  - the list: one row per person, 7 vertical padding. Avatar 32, name 13/500 (+ "(you)" in text-3), email 12px text-3, and the role right-aligned: "Owner" in text-3, "Editor" in text-2.
  - Owner first, then editors in the order added.
- **Validation and feedback**, shown under the input, 12px, icon 14:

| Case | Message and state |
|---|---|
| Invalid email | "Enter a valid email address." (danger, input error border) |
| No such user [21] | "No DocSpace account uses {email}. Ask them to sign up first." |
| Owner's own email | "You already own this document." |
| Already shared | "{name} already has access." |
| Loading [22] | The Share button shows a spinner only and is disabled |
| Success [23] | The input clears and keeps focus; the new person appears at the bottom with a 1.6s accent-soft highlight; "{name} can now edit this document." in success green; toast "Shared with {name}" |

- **Editing the input** clears the message.
- **Editor view [24]:** no invite row. Instead a subtle alert with `Lock`: "Only {owner name} can add people to this document." Then the same list.
- **Footer:** "Done" (secondary).
- **Backend:** `POST /api/documents/:id/share {email}` returns 200 with `{user}`, 404 for no such user, or 409 if the user is already shared or is the owner. Map these to the messages above.

### 4.7 Import dialog [26]–[30]
- **Header:** title "Import a file", sub "The file becomes a new document you can edit." Close `X`.
- **Drop zone [26]:**
  - 1.5px dashed border-strong, radius 8, padding 28/20, centred;
  - content: a 36 `FileUp` tile, "**Drag a .txt file here** or browse" ("browse" in accent 500), then "Plain text (.txt) only, up to 1 MB" (12px text-3);
  - the whole zone is a button: click, Enter or Space opens the file picker (`accept=".txt,text/plain"`);
  - drag-over: accent border + accent-soft bg;
  - note below: `Info` + "Each line break becomes a new paragraph. The file name becomes the document title."
- **Invalid [27]:** the zone turns danger (border + soft bg). Message: ""budget.pdf" isn't a .txt file. Only plain text files can be imported." For files over 1 MB: ""x.txt" is 1.4 MB. The limit is 1 MB."
- **Selected [28]:** a file row (1px border, radius 8, 10/12 padding): a 32 `FileText` tile, the name 13/500, "2.1 KB · Plain text" 12px text-3, and an `X` to remove it. Note: "Creates a new document named "{name without .txt}"." The Import button becomes enabled.
- **Footer:** Cancel (secondary) and Import (primary, disabled until a valid file is chosen).
- **Loading [29]:** Import shows a spinner and "Importing…", Cancel is disabled, and a 4px accent progress bar appears under the file.
- **Success [30]:** the dialog closes, the editor opens on the new doc, and a toast reads "Imported "{title}"".
- **Server error:** an inline danger message "Couldn't import this file. Try again." Buttons re-enable.
- **Backend:** `POST /api/documents/import` (multipart `file`) returns `{id}`. The server converts lines to paragraphs and rejects non-.txt files or files over 1 MB with 400. The client checks the same rules before uploading.

### 4.8 Toasts
Use sonner with the custom styling in components.md, bottom-right, 4s.

**Messages used:**
- "Document renamed"
- "Shared with {name}"
- "Imported "{title}""
- "Switched to {name}"
- "All changes saved" (after a save retry)

Error toasts are for failures that have no inline place to show.

## 5. Navigation flows
1. **Sign in:** Login, then My documents. A demo account click goes straight in.
2. **Create:** New document (sidebar or header), then the editor with the title selected.
3. **Open:** click a row or press Enter on a focused row, to the editor; Back returns to the list it came from.
4. **Rename:** edit the title in the editor, or row menu → Rename on the dashboard.
5. **Owned vs shared:** sidebar links. The active link and page title change; the table is the same component.
6. **Format:** select text, then a toolbar button or shortcut. Active states update live.
7. **Share:** editor Share or row menu → Share. Add an email; the list updates; Done.
8. **Import:** sidebar "Import file" or the dashboard Import button. Pick or drop a .txt, press Import, and the new doc opens.
9. **Switch user:** account menu, then the other demo user. The lists reload and the counts change.
10. **Sign out:** account menu → Sign out, then Login.

## 6. Accessibility (required)
- **Keyboard:** everything works by keyboard.
  - Rows are focusable (`tabindex=0`, Enter opens).
  - Menus support arrow keys and Esc, and return focus to their trigger (shadcn default).
  - Dialogs trap focus, close on Esc, and restore focus.
- **Focus:** a visible 2px accent focus ring on every control. Never `outline:none` without a replacement.
- **Labels:**
  - every icon-only button has an `aria-label`, and a tooltip with the same text plus its shortcut;
  - toolbar buttons use `aria-pressed`;
  - the toolbar has `role=toolbar` and `aria-label="Formatting"`.
- **Live regions:** save status and toasts are `aria-live=polite`. Form errors use `role=alert`.
- **Contrast (WCAG AA, measured):** every text colour passes 4.5:1 on white and on bg.
  - text #18181b 17:1; text-2 #5f5f66 6.3:1; text-3 #6f6f76 5.0:1 (4.6:1 on bg), placeholders included;
  - accent #3451d1 6.5:1; danger 5.4:1; success #1a7a43 5.4:1; warning 5.2:1.
- **Editor:** the Tiptap content gets `aria-label="Document body"` and `aria-multiline="true"`.
- **Motion:** honour `prefers-reduced-motion`.

## 7. Responsive (details in `design/responsive.md`) [31]–[37]

| Width | Behaviour |
|---|---|
| ≥1024 | Full layout |
| <1024 | The sidebar becomes an overlay drawer: a 48h top bar with a `Menu` button and the logo, and a scrim behind the drawer; it closes on scrim tap or navigation. The Owner column is hidden. The page padding drops to 56/64. |
| <640 | Rows become two lines (name, then "Owner · time"). The header actions go full width. Search is full width. The format bar scrolls sideways. The page becomes full-bleed with 28/20 padding. The title shrinks to max 150w; the save status shows its icon only; the owner pill is hidden. Dialogs are the screen width minus 32. |

## 8. Component map (build these once, reuse)
| Component | Built on | Used in |
|---|---|---|
| `AppShell`, `Sidebar`, `NavItem`, `AccountMenu` | DropdownMenu, Sheet (<1024) | Dashboard, Shared |
| `DocumentTable`, `DocumentRow`, `RowMenu`, `InlineRename` | DropdownMenu, Input | 4.3, 4.4 |
| `EmptyState` (variant default/error), `TableSkeleton` | — | lists, editor errors |
| `EditorTopBar`, `TitleInput`, `SaveStatus` | Input, Tooltip | 4.5 |
| `FormatToolbar`, `ToolbarButton`, `BlockTypeSelect` | Toggle, DropdownMenu, Tooltip | 4.5 |
| `DocumentCanvas` | Tiptap EditorContent | 4.5 |
| `ShareDialog`, `PersonRow`, `RoleLabel` | Dialog, Input, Avatar | 4.6 |
| `ImportDialog`, `DropZone`, `FileRow` | Dialog | 4.7 |
| `UserAvatar` | Avatar (initials + colour) | everywhere |

## 9. Mock data (use for seeds)
**Users** (password `demo1234`):
- Maya Chen, maya@docspace.dev
- Daniel Okafor, daniel@docspace.dev
- Priya Raman, priya@docspace.dev. She is a share target only and has no login shortcut.

**Documents**, with their content in `preview/app.js`:

| Document | Owner | Shared with |
|---|---|---|
| Q4 Product Roadmap | Maya | Daniel |
| Engineering Team Meeting Notes | Daniel | Maya |
| Customer Research Summary | Maya | nobody |
| Project Launch Checklist | Priya | Maya and Daniel |
| Design System Guidelines | Maya | Priya |
| Hiring Plan: Platform Team | Daniel | nobody |

## 10. Screenshot index
| # | Screen / state | # | Screen / state |
|---|---|---|---|
| 01 | Login | 20 | Share dialog (owner) |
| 02 | Login loading | 21 | Share error: unknown user |
| 03 | Login invalid | 22 | Share loading |
| 04 | My documents | 23 | Share success |
| 05 | Row menu | 24 | Share dialog (editor, read-only) |
| 06 | Inline rename | 25 | Editor on a shared doc |
| 07 | Account menu / switch user | 26 | Import empty |
| 08 | Search no results | 27 | Import invalid file |
| 09 | Shared with me | 28 | Import file selected |
| 10 | Dashboard loading / empty / error | 29 | Import loading |
| 11 | Shared empty | 30 | Import success → new doc |
| 12 | Editor | 31 | Tablet dashboard |
| 13 | Active formatting | 32 | Tablet nav drawer open |
| 14 | Toolbar tooltip | 33 | Tablet editor |
| 15 | Text style menu | 34 | Mobile login |
| 16 | Unsaved | 35 | Mobile dashboard |
| 17 | Saving | 36 | Mobile editor |
| 18 | Saved | 37 | Mobile share dialog |
| 19 | Save error | | |
