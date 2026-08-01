# Sawiyya Design System — Rebuild Contract

The shared foundation every screen-build agent imports. Values are lifted
literally from the `.dc.html` references and `HANDOFF.md`. Do **not** restyle or
fork these primitives — compose them.

Stack: React 18 + TypeScript (strict) + Vite + Tailwind 3. All primitives are
RTL-safe via CSS logical properties. `Lang = "en" | "ar"` (from `src/types.ts`).

---

## 1 · Tokens (Tailwind)

Declared in `tailwind.config.js` (`theme.extend`). **This table is the shipped
config, not the original rebuild spec.** Where the H15 contrast pass moved a
value, the value below is the one that actually paints. Tokens that were
declared and never used have been removed rather than left as documentation the
code does not honour.

### Colours

| Class stem | Hex | Use |
|---|---|---|
| `teal` | `#0F6E6A` | Primary brand fill |
| `teal-deep` | `#0A4F4C` | Deep teal surface, and the hard bottom edge of every teal spring/extruded button |
| `teal-ink` | `#16302E` | Darkest teal text. Same value as `ink` |
| `teal-ink900` | `#0A1F1D` | Declared, currently unused. Button edges use `teal-deep` |
| `coral` | `#E8654C` | Coral fill on dark or large surfaces only, fails AA as small text |
| `coral-soft` | `#F08A75` | Tint |
| `coral-deep` | `#B54834` | H15: the AA-safe coral. Button faces and coral foregrounds. The spec originally said `#C54F3A` |
| `coral-edge` | `#9C3D2C` | Bottom edge under a `coral-deep` face. Shadow only, never text |
| `gold` | `#E6B24C` | Reward fill, arcs, medallions |
| `gold-soft` | `#F0C879` | Tint |
| `gold-mid` | `#E6B24C` | Progress fill / reward accent. Same value as `gold` |
| `gold-deep` | `#7F621F` | H15: gold that is legible as TEXT, 5.01:1 on sand and 5.36:1 on paper. The spec originally said `#C89A3D`, which measured 2.26:1 and failed AA |
| `gold-edge` | `#C89A3D` | The pre-H15 `gold-deep`, kept only as the gold button's bottom edge. Shadow only, never text |
| `success` | `#1F8A5B` | Correct states, completed nodes |
| `sand` | `#F6EFE3` | App background |
| `paper` | `#FBF7EF` | Card surface |
| `paper2` | `#F1E7D6` | Canvas / behind-app background |
| `ink` | `#16302E` | Body text |
| `muted` | `#566B68` | H15: secondary text. Was `#5C726F`, which measured 4.49:1, a hair under AA |
| `line` | `#EDE3D2` | Hairlines, dividers |

Use as `bg-success`, `text-gold-deep`, `bg-paper2`, `bg-gold-mid`, and so on.

**The `deep` / `edge` split is load-bearing.** `gold-deep` and `coral-deep` are
the foreground tones: reach for them whenever the colour carries text.
`gold-edge` and `coral-edge` are the darker shadow tones that sit under a button
face, and must never be used for text: `gold-edge` on sand is 2.26:1.

`danger` (`#C0492F`) was declared and never used once anywhere in `src/`. It has
been deleted. Use `coral-deep` for error foregrounds.

### Type faces

| Class | Stack | Use |
|---|---|---|
| `font-sans` | Readex Pro | Dual-script UI and body. Default on `body` |
| `font-display` | Rubik | Headings, numbers, buttons, labels |
| `font-mono` | Rubik | Small uppercase eyebrow and badge labels |

`font-mono` is a legacy utility name from the `.dc.html` references. **The brand
vendors no monospace face** (`src/fonts.css` self-hosts Readex Pro, Rubik and
Material Symbols only), so the utility is mapped to Rubik. Left unmapped it fell
through to Tailwind's default system stack and rendered as SF Mono on iPhone,
Roboto Mono on Android and Consolas on Windows. Prefer `font-display` in new
code; the ~20 remaining `font-mono` call sites are a follow-up sweep.

### Motion easings (`transitionTimingFunction`)

| Class | cubic-bezier | Use |
|---|---|---|
| `ease-spring` | `.34,1.56,.64,1` | Button release, pop-in, Fanan |
| `ease-standard` | `.4,0,.2,1` | Most transitions |

`ease-enter` and `ease-exit` were declared for a screen push/pop transition that
was never built. Both are deleted.

### Keyframes + animations

| Class | Definition | Use |
|---|---|---|
| `animate-pop-in` | `pop-in .45s` scale .8→1.05→1 + fade | Card / sheet entry |
| `animate-rise` | `rise .5s` translateY 12px→0 + fade | Content entry |
| `animate-pulse-ring` | `pulse-ring 1.4s infinite` gold halo | Attention ring |
| `animate-float` | `float 2.6s ease-in-out infinite`, ±7px bob | Idle / mascot bob |
| `animate-pop` | `pop .4s cubic-bezier(.34,1.56,.64,1) both`, scale 0→1.1→1 | Checks, badges, scale-in |

`animate-shimmer` (skeleton loading) and `animate-confetti` were both declared
and never used: the real celebration is a canvas, in
`src/components/Confetti.tsx`. Both keyframes and both utilities are deleted.

Global keyframes `float` and `sparkle-pop` are also declared in `src/styles.css`
(outside JIT purge) so Fanan's inline animations always resolve.

Reduce-motion: the global `@layer base` rule in `src/styles.css` freezes all
animations and transitions. Do not re-implement per component.

### Spring button utility classes (`src/styles.css`)

`.spring` (transition) + `.spring-teal|coral|gold` (hard `0 5px 0 <edge>` shadow;
on `:active` → `translateY(4px)` + `0 1px 0`). Consumed by `SpringButton`; you
normally won't reference these directly. `.extruded-teal|coral|gold` are the
chunkier `0 6px 0` variant used by `ui.tsx`'s `Button`. All six read their edge
colour from the tokens via `theme()`, so there is one place to change it.

`.extruded-paper` and `.extruded-teal-pressed` were declared and never used.
Both are deleted.

---

## 2 · Primitives

### Fanan — the mascot

```
import { Fanan, type FananPose } from "../components/Fanan";

export type FananPose = "idle" | "think" | "cheer" | "sad" | "celebrate" | "wave";
export interface FananProps { pose?: FananPose; scale?: number; className?: string }
export function Fanan(props: FananPose extends never ? never : FananProps): JSX.Element
// default export also available
```

- `pose` default `"idle"`; `scale` default `1` (anchors bottom-centre).
- Pure divs + inline styles, exact geometry from `Fanan.dc.html`.
- **Never mirrors in RTL** — uses physical left/right on purpose. Renders
  identically inside `dir="rtl"`.
- `celebrate` shows sparkles; `wave`/`celebrate` raise a floating paw.

```tsx
<Fanan pose="celebrate" scale={0.9} />
```

---

All remaining primitives live in `src/components/dc.tsx`.

### SpringButton

```
import { SpringButton } from "../components/dc";

export type SpringVariant = "teal" | "coral" | "gold" | "ghost";
export type SpringSize = "sm" | "md" | "lg";
export interface SpringButtonProps {
  children: ReactNode;
  variant?: SpringVariant;   // default "teal"
  size?: SpringSize;         // default "md"
  disabled?: boolean;
  full?: boolean;            // w-full
  onClick?: () => void;
  type?: "button" | "submit"; // default "button"
  className?: string;
  ariaLabel?: string;
}
export function SpringButton(props: SpringButtonProps): JSX.Element
```

Solid fill + hard 5px bottom shadow; on press drops 4px and shadow shrinks to
1px. ≥44px hit target. `ghost` = flat sand fill + hairline (no lift). Fill/text:
teal→paper, coral→paper, gold→ink, ghost→ink.

```tsx
<SpringButton variant="teal" size="lg" full onClick={next}>Continue</SpringButton>
<SpringButton variant="ghost" onClick={skip}>Skip</SpringButton>
```

### Card

```
import { Card } from "../components/dc";

export interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;      // renders as <button> when provided
  ariaPressed?: boolean;
  ariaLabel?: string;
}
export function Card(props: CardProps): JSX.Element
```

Paper `#FBF7EF` bg, 1px `#EDE3D2` hairline, 20px radius, hard `0 2px 0 #EDE3D2`
shadow. Interactive when `onClick` set (adds active-scale + focus ring). Add your
own padding via `className`.

```tsx
<Card className="p-6"><Title>Alphabet</Title></Card>
<Card onClick={open} ariaPressed={selected} className="p-4">…</Card>
```

> **M25:** `src/components/ui.tsx` also exports `ScreenCard` — a distinct
> flat/elevated/selected general screen-content card (Home, LessonPlayer,
> Fingerspell, DevMetrics, InfoPages, FlagCard, GoalCard). It used to be
> misnamed `Card` there too, which is what "most screens import both" meant;
> the rename is the whole fix — both card systems stay, now unambiguous.
> `ui.tsx`'s `Pill` was a true duplicate (identical API, fewer tones) and is
> gone — it now just re-exports this one.

### Pill

```
import { Pill } from "../components/dc";

export type PillTone = "teal" | "gold" | "coral" | "muted" | "ink" | "success";
export interface PillProps {
  children: ReactNode;
  tone?: PillTone;           // default "teal"
  className?: string;
  onClick?: () => void;      // renders as <button> when provided
  ariaLabel?: string;
}
export function Pill(props: PillProps): JSX.Element
```

99px-radius chip. `ink` tone = solid dark (paper text); others are tinted.

```tsx
<Pill tone="gold">+12 XP</Pill>
<Pill tone="teal" onClick={filter}>Letters</Pill>
```

### MonoLabel

```
import { MonoLabel } from "../components/dc";

export interface MonoLabelProps { children: ReactNode; className?: string; lang?: Lang }
export function MonoLabel(props: MonoLabelProps): JSX.Element
```

11px/700 uppercase, letter-spacing .12em, in the display face (Rubik): see the
`font-mono` note in §1, the brand has no monospace. Inherits colour, set it with
`className` (e.g. `text-muted`, `text-teal`). Latin/section labels only, and
pass `lang` so `ar` drops the uppercase and tracking that sever cursive joins.

```tsx
<MonoLabel className="text-teal">01 · Colour</MonoLabel>
```

### Removed: OnDeviceBadge, ConfidenceRing, Tile

`OnDeviceBadge` and `ConfidenceRing` were exported from `dc.tsx`, and `Tile` from
`src/components/Tile.tsx`, with **zero call sites each**, while the screens hand
rolled the same three things. They are deleted rather than left as a documented
API nothing honours.

- The camera privacy chip lives inline in `CameraTrainer`.
- `ConfidenceRing` is not a stand-in for CameraTrainer's hold ring: that ring is
  a hold-to-confirm timer with a check in the middle, while this one printed a
  live percentage and announced `role="progressbar"`. Swapping them would show a
  number the design withholds and read a bogus progress value to screen readers.
- `Chip` (the small selectable pill, still in `src/components/Tile.tsx`) is alive
  and used by `FlagPicker` and `CameraPractice`. Only its big-card sibling went.

Unifying the ~22 hand-rolled `aria-pressed` selection controls onto one treatment
is still open, and it is a screen-by-screen job, not a dead export.

### Localization helpers

```
import { toLocaleDigits, formatPercent } from "../components/dc";

export function toLocaleDigits(n: number, lang: Lang): string  // "50" | "٥٠"
export function formatPercent(pct: number, lang: Lang): string // "50%" | "٥٠٪"
```

Use for any number/percent shown in the UI so Arabic never mixes scripts
(HANDOFF §2).

---

## 3 · Rules for screen agents

- Compose these primitives; never re-implement the spring shadow, card shadow or
  pill inline.
- Never hardcode a hex that a token already names. `gold-deep` for gold text,
  `gold-edge` only for a button's bottom shadow, and the same split for coral.
- Fanan is one character — pose it by prop; never recolour or redraw.
- Every screen ships EN (LTR) + AR (RTL). Anchor with logical properties
  (`ms-`/`me-`, `ps-`/`pe-`, `text-start`, `inset-inline-*`).
- All UI numerals go through `toLocaleDigits` / `formatPercent`.
- Do not touch `src/screens`, `src/store`, `src/recognizer`, `src/lesson`, or
  `src/i18n.ts` content when only styling.
```
