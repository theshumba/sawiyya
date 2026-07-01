# Sawiyya — Developer Handoff

Learn Arabic Sign Language. Camera-graded, on-device, bilingual (English LTR + Arabic RTL), mascot-led (**Fanan**, a fennec fox).

This package is a set of **hi-fi design references** built as self-contained HTML. Every file opens in a browser and can be read directly — all colors, type, motion values and copy are literal and inline. Lift values straight from the source; nothing is hidden behind a build step or a token library.

---

## 1 · Design tokens

### Color

| Token | Hex | Use |
|---|---|---|
| `teal/primary` | `#0F6E6A` | Primary actions, path nodes, brand |
| `teal/deep` | `#16302E` | Text on light, dark surfaces, device bezel |
| `teal/ink-900` | `#0A1F1D` | Button drop-shadow (`box-shadow` bottom) |
| `paper/0` | `#FBF7EF` | Cards, elevated surfaces |
| `paper/1` | `#F6EFE3` | App background (light) |
| `paper/2` | `#F1E7D6` | Canvas / behind-app background |
| `gold/light` | `#F0C879` | Highlights, streak accents on dark |
| `gold/mid` | `#E6B24C` | Progress fill, reward accents |
| `coral` | `#E8654C` | Badges, "your turn", tertiary accent |
| `success` | `#1F8A5B` | Correct states, completed nodes |
| `danger` | `#C0492F` | Errors, "never mirrors" |
| `text/sub` | `#5C726F` | Secondary text on light |
| `text/mute` | `#94A5A2` | Tertiary / captions on light |
| `line` | `#EDE3D2` | Hairline borders on paper |

**Dark theme** (see `Sawiyya Dark Mode.dc.html` for the full map): app bg `#0E1B1A`, surface `#12211F`/`#1D3D3A`, line `#274744`, primary brightens to `#1E9E96`, success to a lighter green, gold/coral unchanged, text `#F6EFE3` / sub `#9DB0AD` / mute `#7E938F`.

**High-contrast** (see `Sawiyya Accessibility.dc.html`): bg `#FFFFFF`, text `#000000`, primary darkens to `#00413B`, borders `2px solid #000`.

### Type

- **Latin:** Rubik (400–800). Display/UI + all headings.
- **Arabic:** Readex Pro (300–700). Display/UI. Pairs optically with Rubik.
- Arabic gets **+0.15 line-height** over Latin at every step.

| Role | Size (px) | Weight |
|---|---|---|
| Display | 30–46 | 800 |
| Title | 20–24 | 800 |
| Body | 15–17 | 400–600 |
| Caption | 12–13 | 400–700 |
| Mono label | 11 | 600–700, letter-spacing .12em, uppercase (ui-monospace/Menlo) |

Mobile min font 15px; hit targets ≥ 44px.

### Shape & elevation

- Radii: cards `18–20px`, inner tiles `10–16px`, phone screen `42px`, device `50px`, pills `99px`.
- Signature button: solid fill + **hard bottom shadow** `box-shadow: 0 5px 0 <deep>` (no blur) — the "springy" affordance. On press, translateY(4px) and drop the shadow.
- Card elevation on paper: `box-shadow: 0 2px 0 #EDE3D2` (hard, 1px hairline border).

### Motion

See `Sawiyya Motion.dc.html` for plotted curves. Core values:

| Name | cubic-bezier | Duration | Use |
|---|---|---|---|
| Spring out | `.34,1.56,.64,1` | 260ms | Button press release, pop-in |
| Ease standard | `.4,0,.2,1` | 220ms | Most transitions |
| Ease-in (exit) | `.4,0,1,1` | 180ms | Screen pop / dismiss |
| Ease-out (enter) | `0,0,.2,1` | 240ms | Screen push |
| Confetti | linear fall + spin | 1.4s | Celebration |

Reduce-motion: freeze pulse/float/confetti; keep instant state change. RTL: push/pop enters from the leading (left) edge.

---

## 2 · Localization / RTL (non-negotiable)

- Design the Arabic screen **first**. Everything anchors to the start edge with `dir="rtl"` + logical properties (`inset-inline-start`, `margin-inline`, `flex` order).
- **Numerals:** Arabic UI uses Eastern-Arabic glyphs `٠١٢٣٤٥٦٧٨٩`; percent is `٪` and trails. Never mix scripts on one screen.
- **Mirrors:** reading flow, arrows/chevrons, progress fill, tab order, slide direction.
- **Never mirrors:** clock/status time, play/camera/record glyphs, the checkmark, Fanan, logos, and sign-language handshapes (they are physical).

Full rules + demos: `Sawiyya Localization.dc.html`.

---

## 3 · The core loop (build this first)

The single most important interaction — `Sawiyya Practice Loop.dc.html` and `Sawiyya First Sign.dc.html`:

1. **Watch** — a signer demos the target sign (loopable).
2. **Your turn** — camera on; app hunts for the hand ("Finding your hand…"), then locks a gold hand-skeleton overlay. An **on-device** badge is always visible.
3. **Detecting** — a confidence ring fills 0→100% in real time.
4. **Result** — ≥ threshold → success chime + haptic + Fanan celebrates + confetti + % match. Below → gentle "almost", retry. Never a hard fail.

Camera frames **never leave the device** — this is a product promise, surface it in UI (see privacy moments in onboarding + settings).

Sound/haptic pairing for every event: `Sawiyya Sound & Haptics.dc.html`.

---

## 4 · File map

**Core journey**
- `Sawiyya Boot.dc.html` — splash / loading / update / brand
- `Sawiyya Onboarding.dc.html` — first-run flow + privacy moment
- `Sawiyya First Sign.dc.html` — live camera-graded quick win
- `Sawiyya Home Path.dc.html` — learning path (nodes, nav, popover)
- `Sawiyya Practice Loop.dc.html` — **the core loop template** (3 content instances)
- `Sawiyya Practise.dc.html` — practise hub + MCQ / match / results
- `Sawiyya Celebrations.dc.html` — streak / goal / achievement / level-up / certificate
- `Sawiyya Prototype.dc.html` — clickable Boot→Onboarding→First Sign→Home→Practice

**Reference, people & system**
- `Sawiyya Signs.dc.html` — dictionary: browse / alphabet grid / detail / search
- `Sawiyya Family.dc.html` — profile switcher / hub / feed
- `Sawiyya Progress.dc.html` — oasis / dashboard + heatmap / achievements / league
- `Sawiyya Profile.dc.html` — profile / settings / a11y / privacy / about / help
- `Sawiyya States.dc.html` — permission / empty / error / offline
- `Sawiyya Curriculum.dc.html` — units → levels → sign grouping
- `Sawiyya Notifications.dc.html` — re-engagement nudge ladder + rules

**Specs & assets**
- `Sawiyya Style Sheet.dc.html` — one-page foundation (poses, type, buttons, motion, spacing)
- `Sawiyya Motion.dc.html` — easing curves, transitions, confetti timing
- `Sawiyya Sound & Haptics.dc.html` — audio/vibration language (interactive)
- `Sawiyya Localization.dc.html` — mirroring, numerals, bilingual type
- `Sawiyya Accessibility.dc.html` — captions / contrast / large-text / reduce-motion (interactive)
- `Sawiyya Dark Mode.dc.html` — dark token map + core screens
- `Sawiyya Brand.dc.html` — app icon + variants
- `Sawiyya Share.dc.html` — cold-start share card + family invite
- `Sawiyya App Store.dc.html` — 6 marketing frames + listing copy
- `Fanan.dc.html` — the reusable mascot (props: `pose` enum, `scale`)
- `Sawiyya Index.dc.html` — **start here**, links every surface

---

## 5 · Notes for implementation

- **Fanan** is a component with a `pose` prop (e.g. wave, celebrate, think, sleep). Everywhere the fox appears it's the same character — build it once, pose it by prop.
- Every screen exists in **EN + AR**. Don't ship one without the other.
- Notifications: one/day max, streak-risk only if a streak exists, honour DND, go silent after 3 ignores, never guilt. See `Sawiyya Notifications.dc.html`.
- Curriculum: frequency-first sign selection, handshapes layered gently, each unit ends in a mixed review. See `Sawiyya Curriculum.dc.html`.
- These HTML files are **references, not the app codebase**. Rebuild in your target stack (React Native / Flutter / native); use the files as the source of truth for values, layout, copy and behaviour.
