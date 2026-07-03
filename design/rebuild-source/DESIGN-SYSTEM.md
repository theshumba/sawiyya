# Sawiyya Design System — Rebuild Contract

The shared foundation every screen-build agent imports. Values are lifted
literally from the `.dc.html` references and `HANDOFF.md`. Do **not** restyle or
fork these primitives — compose them.

Stack: React 18 + TypeScript (strict) + Vite + Tailwind 3. All primitives are
RTL-safe via CSS logical properties. `Lang = "en" | "ar"` (from `src/types.ts`).

---

## 1 · Tokens (Tailwind)

Added in `tailwind.config.js` (`theme.extend`). Existing teal/coral/gold/sand/
paper/ink/muted/line keys are unchanged.

### Colours (new)

| Class stem | Hex | Use |
|---|---|---|
| `teal-ink900` | `#0A1F1D` | Button hard-shadow deep tone (HANDOFF §1) |
| `gold-mid` | `#E6B24C` | Progress fill / reward accent |
| `success` | `#1F8A5B` | Correct states, completed nodes |
| `danger` | `#C0492F` | Errors, "never mirrors" |
| `paper2` | `#F1E7D6` | Canvas / behind-app background |

Use as `bg-success`, `text-danger`, `bg-paper2`, `bg-gold-mid`, `text-teal-ink900`, etc.

Pre-existing (reference): `teal` `#0F6E6A` (`teal-deep` `#0A4F4C`, `teal-ink` `#16302E`),
`coral` `#E8654C` (`coral-soft` `#F08A75`, `coral-deep` `#C54F3A`), `gold` `#E6B24C`
(`gold-soft` `#F0C879`, `gold-deep` `#C89A3D`), `sand` `#F6EFE3`, `paper` `#FBF7EF`,
`ink` `#16302E`, `muted` `#5C726F`, `line` `#EDE3D2`.

### Motion easings (new → `transitionTimingFunction`)

| Class | cubic-bezier | Use |
|---|---|---|
| `ease-spring` | `.34,1.56,.64,1` | Button release, pop-in, Fanan |
| `ease-standard` | `.4,0,.2,1` | Most transitions |
| `ease-enter` | `0,0,.2,1` | Screen push (enter) |
| `ease-exit` | `.4,0,1,1` | Screen pop / dismiss |

### Keyframes + animations

Existing: `animate-pop-in`, `animate-rise`, `animate-pulse-ring`, `animate-shimmer`.

New:

| Class | Definition | Use |
|---|---|---|
| `animate-confetti` | `confetti 1.4s linear forwards` — translateY fall + 430° spin, fade | Celebration confetti |
| `animate-float` | `float 2.6s ease-in-out infinite` — ±7px bob | Idle / mascot bob |
| `animate-pop` | `pop .4s cubic-bezier(.34,1.56,.64,1) both` — scale 0→1.1→1 | Checks, badges, scale-in |

Global keyframes `float` and `sparkle-pop` are also declared in `src/styles.css`
(outside JIT purge) so Fanan's inline animations always resolve.

Reduce-motion: the global `@layer base` rule in `src/styles.css` freezes all
animations/transitions — do not re-implement per component.

### Spring button utility classes (`src/styles.css`)

`.spring` (transition) + `.spring-teal|coral|gold` (hard `0 5px 0 <deep>` shadow;
on `:active` → `translateY(4px)` + `0 1px 0`). Consumed by `SpringButton`; you
normally won't reference these directly.

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

export interface MonoLabelProps { children: ReactNode; className?: string }
export function MonoLabel(props: MonoLabelProps): JSX.Element
```

11px/700 uppercase monospace, letter-spacing .12em. Inherits colour — set with
`className` (e.g. `text-muted`, `text-teal`). Latin/section labels only.

```tsx
<MonoLabel className="text-teal">01 · Colour</MonoLabel>
```

### OnDeviceBadge

```
import { OnDeviceBadge } from "../components/dc";

export interface OnDeviceBadgeProps { lang: Lang; className?: string }
export function OnDeviceBadge(props: OnDeviceBadgeProps): JSX.Element
```

Always-visible camera privacy badge: dark `#16302E` pill + green live-dot + lock
glyph (never mirrors) + label. Text: EN "On-device · nothing leaves your phone",
AR "على جهازك · لا شيء يغادر هاتفك". Place on every camera frame.

```tsx
<OnDeviceBadge lang={lang} className="absolute inset-inline-start-3 top-3" />
```

### ConfidenceRing

```
import { ConfidenceRing } from "../components/dc";

export interface ConfidenceRingProps {
  value: number;   // 0..1 (clamped; non-finite → 0)
  lang: Lang;
  size?: number;   // px, default 96
  stroke?: number; // px, default 9
  className?: string;
}
export function ConfidenceRing(props: ConfidenceRingProps): JSX.Element
```

SVG ring, gold `#E6B24C` arc fills 0→100% from `value`, faint teal track. Centre
shows localized percent — Eastern-Arabic digits + `٪` for `ar`. Has
`role="progressbar"` with `aria-valuenow`.

```tsx
<ConfidenceRing value={0.87} lang={lang} size={120} />
```

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

- Compose these primitives; never re-implement the spring shadow, card shadow,
  pill, ring, or badge inline.
- Fanan is one character — pose it by prop; never recolour or redraw.
- Every screen ships EN (LTR) + AR (RTL). Anchor with logical properties
  (`ms-`/`me-`, `ps-`/`pe-`, `text-start`, `inset-inline-*`).
- All UI numerals go through `toLocaleDigits` / `formatPercent`.
- Do not touch `src/screens`, `src/store`, `src/recognizer`, `src/lesson`, or
  `src/i18n.ts` content when only styling.
```
