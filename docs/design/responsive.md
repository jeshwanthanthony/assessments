# Responsive layout

Desktop-first. Two breakpoints: `lg` = 1024, `sm` = 640 (Tailwind `max-lg`, `max-sm`).

| Area | ≥1024 | 640–1023 (tablet) | <640 (phone) |
|---|---|---|---|
| Sidebar | fixed 240, always visible | hidden; 48h top bar with `Menu` button + logo; sidebar slides in from the left as an overlay (200ms) with a 24% scrim; tap scrim or a link to close | same as tablet |
| Dashboard padding | 32/40, content max 1040 centered | 24 | 20/16 |
| Page head | title left, actions right | same | actions wrap below title, each button flex-1 |
| Search | 280w | 280w | full width; doc count hidden |
| Table columns | Name / Owner / Last modified / actions | Name / Last modified / actions (Owner hidden) | Name / actions; row 56h; owner + time move under the name as a 12px line; header row hidden |
| Editor top bar | back, title (max 420w), save label, owner pill (shared docs), Share, avatar | same | title max 150w with ellipsis, save shows icon only, owner pill hidden |
| Format bar | centered | centered | left-aligned, scrolls sideways (no wrap) |
| Page | 816 max, padding 72/96, page shadow, 40 canvas padding | padding 56/64 | full-bleed white, no shadow, padding 28/20 |
| Dialogs | 480, 12vh from top | same | width = screen − 32 |
| Toasts | bottom-right 16 | same | bottom, full width minus 32 |

Touch targets: on <640 every tappable control is at least 32h and rows are 56h. Nothing scrolls sideways except the format bar.
See screenshots 31–37.
