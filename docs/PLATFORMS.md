# PLATFORMS.md - smooth and correct on every phone and computer

This file is the working half of the "every platform" hard rule in
`AGENTS.md` for DocSpace. It says who we build for,
what each engine can draw smoothly, the rules every visual, motion or layout
change follows, the exceptions we allow and why, how we check, and how the
knowledge stays current.

**Before any visual, motion or layout change:** read sections 2 to 4. **After
it:** run the motion test. **When the weekly browser watch opens an issue:**
section 7. **Never guess a capability:** look it up (MDN compat data, the
engine's own source or release notes), then record what you found in
section 8.

## 1. Who we build for (the support line)

Every browser on an iPhone or iPad is WebKit: Safari, the Google app, Chrome
for iOS, Edge, Firefox for iOS, and in-app browsers. So "iPhone" means one
engine with a few switches.

| Platform | What people run | Our level |
|---|---|---|
| iPhone, iPad | Current iOS and the two before it cover nearly everyone | Full on the current and previous major iOS. Correct (everything works and reads right, motion may be plainer) on older supported versions. Write the floor here. |
| Android | Chrome, Samsung Internet (Chromium based), Firefox, in-app WebViews (some frozen at older Chrome) | Full on current Chrome, Samsung Internet and WebView; correct on Firefox and older WebViews. |
| Mac | Safari, Chrome, Edge, Firefox | Full. |
| Windows | Chrome, Edge, Firefox; some business machines and virtual machines run with no GPU | Full; correct without a GPU. |

"Full" means every motion runs on the compositor (section 2), so it stays
smooth while the page is busy. Refresh the shares twice a year from
StatCounter and TelemetryDeck (section 7).

Form controls: check each one against MDN's browser-compat-data before
relying on it, and record the gaps. Example: iOS Safari's date picker does
not grey out dates outside `min` and `max`, so the UI disables submit for an
out-of-range date and the server refuses it; the value is always
`YYYY-MM-DD` whatever the device shows.

## 2. What each engine draws smoothly

The compositor moves and fades layers on its own thread; anything else is
redrawn by the page's main thread on every frame, which stutters whenever the
page is busy and drops to 30 fps on an iPhone in Low Power Mode.

| Animated property | WebKit (every iPhone browser, Safari) | Blink (Chrome, Edge, Android) | Gecko (Firefox) | Samsung Internet |
|---|---|---|---|---|
| transform, translate, scale, rotate | compositor | compositor | compositor | compositor |
| opacity | compositor | compositor | compositor | compositor |
| filter | compositor (any filter, a GPU pass each frame) | compositor, except filters that move pixels (blur, drop-shadow) | main thread | as Blink |
| backdrop-filter | compositor (needs `-webkit-` before Safari 18) | compositor | main thread | compositor |
| clip-path | main thread | compositor in recent Chrome (basic shapes only) | main thread | main thread |
| background-color | main thread | compositor in recent Chrome (not under forced dark) | compositor | main thread |
| width, height, top, left, margin, border-radius, box-shadow, color, custom properties, mask, background-position | main thread | main thread | main thread | main thread |

Frame rates: an iPhone's compositor animations ask for up to 120 Hz on
ProMotion screens (in-app browsers stay at 60 Hz); anything the page draws
itself (requestAnimationFrame loops, main-thread animations) is held near
60 fps by Safari and halves to 30 fps in Low Power Mode, in an untouched
cross-origin iframe and under heat throttling. Chrome and Firefox follow the
display (60 to 165 Hz). Android phones in power saving often drop to 60 Hz.

## 3. The rules

1. **Animate only transform and opacity** (visibility as an on or off switch
   at one end). Anything else needs an exception in section 4, with its reason
   and a time limit, before it ships.
2. **Shapes change by moving pieces, never by clip-path, width, height or
   border-radius.** A circle that opens into a pill is drawn by pieces that
   only slide and scale; a box that grows is laid out at its final size and
   animated from the old box with transform (FLIP); two shapes that cannot
   morph cross-fade.
3. **Glows and shadows never animate.** Draw the glow or shadow once on its own
   element and animate that element's opacity or transform. Never animate
   box-shadow, `filter: blur()` or `drop-shadow()`.
4. **Bars, dots and meters scale.** A progress bar, typing dots or an
   equalizer is laid out at its largest and animated with scaleX or scaleY.
5. **Scale down, not up.** WebKit draws a layer at its layout size, so text or
   a picture scaled above 1 looks soft. Lay it out at the largest size it
   reaches and scale it down.
6. **WebKit's timing rules** (`GraphicsLayerCA::animationCanBeAccelerated`):
   no `steps()` or `linear()` easing on motion that must be smooth; no
   `reverse` or `alternate` direction; playbackRate 1; an overshooting
   `cubic-bezier` (y below 0 or above 1) only on a single from-to interval (a
   transition or a two-keyframe `animate()`), never as the easing over three or
   more keyframes (put the overshoot in a keyframe instead).
7. **One animation, one kind.** One animation or `@keyframes` must not mix a
   compositor property with another kind: WebKit then runs every animation on
   that element on the main thread (`KeyframeEffectStack::allowsAcceleration`).
   Separate transitions (opacity in one, visibility in another) are fine.
8. **No `!important` on a property we animate.** Chrome will not run it on the
   compositor. Win with specificity.
9. **will-change sparingly.** Only on what is about to move or a few long-lived
   layers. Phones run out of layer memory.
10. **Glass with care.** Use backdrop-filter only on an element that moves or
    fades itself, never under an ancestor that fades, clips, masks or filters:
    from Safari 18 the blur then goes blank or dark until the motion ends.
    Keep `-webkit-backdrop-filter` for Safari before 18. Low-end Android GPUs
    pay heavily for it; a solid surface is the default.
11. **Script-driven motion is the last resort.** No requestAnimationFrame loop
    that sets styles if CSS or `animate()` can do it. If one is needed, it moves
    by time, never by a step per frame, and stops when nothing moves.
12. **Keep the main thread quiet.** No layout reads (`getBoundingClientRect`,
    `elementFromPoint`) inside per-frame code or observer callbacks unless
    batched; observers narrow (`attributeFilter`) and coalesced;
    `requestIdleCallback` does not exist in Safari (fall back to `setTimeout`).
13. **Reduced motion.** Every looping or travelling motion has a still version
    under `prefers-reduced-motion`.
14. **Phone and PC, touch and mouse, 1x to 3x**: every change is checked at
    both sizes.
15. **Forced dark.** Samsung Internet recolours pages in dark mode and cannot be
    refused; Chrome and WebView's automatic dark can be refused with
    `color-scheme: only light`.
16. **Where no rule exists:** measure it (the motion test names what Chromium
    could not composite), read the engine's own source or release notes, write
    the rule here with its evidence (section 8), and add a check for it.
17. **Scroll-linked changes never animate layout:** a class a scroll position
    switches may change transform or opacity, or change layout instantly,
    never transition height, max-height, margin or padding.
18. **No stylesheet of ours waits behind a loading one:** WebKit does not
    switch on a `<style>` added while any stylesheet `<link>` of the page is
    still loading; until then, what that style would place is laid out with no
    CSS as far as script can measure. So a stylesheet link of ours is added
    `media="print"` and becomes `all` on load, and nothing of ours is measured
    before its styles are known to apply.

## 4. Exceptions (allowed to paint, and why)

The motion test holds the allowed list; a new line needs a reason a reviewer
accepts.

| What | Paints | Why it may | Limit |
|---|---|---|---|
| A press, hover or focus on one control (buttons, a text box, chips) | colour, background, border colour, box-shadow | the user's own action on one small box, a few frames | 300 ms |

## 5. How we check

- **The motion test** (a browser script, the contract): the real app at
  desktop and iPhone size through its main flows. Gate 1: every running
  animation is transform or opacity or a listed exception. Gate 2: none of
  WebKit's timing traps (rule 6), and every `animate()` call in the source
  read for its keyframe count and curve. Gate 3: Chromium's own trace
  verdict, run with Chromium's clip-path and background-color compositing
  switched off so it answers as an iPhone would.
- Run the browser suites in WebKit as well as Chromium (Playwright). If a
  Playwright WebKit build will not open a page on an older macOS, pin a
  Playwright version that matches the installed WebKit build, outside the
  repo's dependencies.
- What the tests cannot do: measure an iPhone's frame rate. Desktop WebKit
  is the engine of every iPhone browser but not an iPhone (no iOS form
  controls, no real touch, no GPU budget). Real Mobile Safari automation
  needs Xcode (safaridriver with the iOS Simulator) or a paid device cloud;
  tell the owner the cost before using one.
- **The hand check after a motion change**: a real iPhone, in Safari and in
  another iOS browser, once with Low Power Mode on.

## 6. Open items

List each known gap with its smallest fix. Remove it when fixed.

## 7. Keeping current: the weekly browser watch

A scheduled job (weekly) reads:

- browser versions: Chrome's version history API, Firefox's product details,
  Apple's Safari release notes, and MDN's compat data for Samsung Internet,
  Safari on iOS and Android WebView (each with the engine version it is built
  on);
- engine posts: the WebKit blog and Safari Technology Preview, the Chrome for
  Developers blog, Chrome Releases, Mozilla Hacks, the Edge blog and Samsung
  Internet's developer blog, kept when they mention animation, compositing
  or a feature these rules depend on;
- support: MDN browser-compat-data for every feature these rules depend on.

A run that finds something opens one issue; a quiet run only logs. It never
edits code or docs.

When an issue comes in: read each item; decide whether a rule, the support
line or an exception changes; record the finding in section 8 with its date
and source, even when nothing changes; when a rule changes, change the code
and the motion test in the same commit.

## 8. Evidence log (newest first)

Each entry: the date, what was measured or read, where (engine, version,
source file or MDN path), and which rule it changed. Engine facts already
established:

- WebKit never composites clip-path (`RenderLayerBacking.cpp`: only opacity,
  transform and its parts, filter and backdrop-filter start accelerated).
- WebKit (`GraphicsLayerCA.cpp`, Safari 15 and later): an animation-wide
  cubic-bezier with y outside 0 to 1 runs on the compositor only over a
  single interval; `steps()`, playbackRate other than 1 and a non-forward
  direction never do.
- WebKit (`KeyframeEffectStack.cpp`): an effect animating only
  non-accelerated properties does not stop the element's other animations;
  one effect mixing both kinds stops them all.
- Firefox composites transform, opacity, background-color and offset-*
  only. Chrome never composites filters that move pixels or animations of
  `!important` properties.
- A `position:fixed` box is placed against the viewport only while no
  ancestor has a transform, filter, perspective, contain (paint, layout,
  strict, content), backdrop-filter, container-type or a will-change naming
  one of them (MDN "position"; the same in WebKit and Blink).
- With the keyboard up, iOS WebKit reports client rects from the panned
  visual viewport; a "is this fixed box in place" check must allow for the
  pan. iOS fires the visual viewport's resize when the keyboard has finished.
- WebKit ignores `min-height` on a `<select>` with its native look; set a
  44 px target with `height`.
- WebKit never focuses a clicked or tapped `<button>`; a dialog that returns
  focus to its opener keeps a reference to the opener, never
  `document.activeElement` at open.
- Screen Wake Lock is optional: use it behind feature detection only.
