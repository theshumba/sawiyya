// Brand UI primitives — Sawiyya design system (Brand Identity §2–4).
// Soft geometry, meeting-curve radii, teal+coral anchors, gold celebration.
import type { ReactNode } from "react";
import { toLocaleDigits } from "./dc";

export function Logo({ size = 36 }: { size?: number }) {
  // "The Seen (س)" — three signing fingers rising from the meeting bowl,
  // gold spark = the moment of connection. Finish 3A (Brand Identity §1).
  return (
    <svg
      width={size}
      height={(size * 120) / 150}
      viewBox="0 0 150 120"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M40 84 V58" stroke="#0F6E6A" strokeWidth="12" strokeLinecap="round" />
      <path d="M62 84 V44" stroke="#0F6E6A" strokeWidth="12" strokeLinecap="round" />
      <path d="M84 84 V54" stroke="#0F6E6A" strokeWidth="12" strokeLinecap="round" />
      <path
        d="M30 86 C46 108 104 110 124 88 L124 78"
        stroke="#0F6E6A"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="103" cy="40" r="7.5" fill="#E6B24C" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-bold tracking-tight ${className}`} dir="ltr">
      sawiyya<span className="text-gold">.</span>
    </span>
  );
}

/** Material Symbols icon (loaded in index.html). `fill` renders the solid variant. */
export function Icon({
  name,
  fill = false,
  className = "",
}: {
  name: string;
  fill?: boolean;
  className?: string;
}) {
  return (
    <span className={`material-symbols-outlined select-none ${fill ? "material-fill" : ""} ${className}`} aria-hidden="true">
      {name}
    </span>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "gold";
type ButtonSize = "sm" | "md" | "lg";

// Extruded "pressable" buttons — flat top face + hard darker bottom edge,
// depressing on :active (mirrored from the approved Stitch design).
// H15: white-on-coral (DEFAULT #E8654C) measured 3.28:1 — below AA 4.5:1 for
// text. coral-deep (#B54834) holds the same hue at 5.33:1 white / 4.99:1 paper.
const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-coral-deep text-white extruded-coral",
  secondary: "bg-teal text-white extruded-teal",
  gold: "bg-gold text-ink extruded-gold",
  ghost: "bg-transparent text-teal border-2 border-teal/30 active:scale-[.98]",
};

// One button size scale (spec §4.2) — stop overriding px/py per call-site.
const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-sm rounded-xl px-4 py-2.5 min-h-[40px]",
  md: "text-base rounded-2xl px-6 py-3.5 min-h-[48px]",
  lg: "text-lg rounded-2xl px-7 py-4 min-h-[56px]",
};

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled,
  full,
  className = "",
  type = "button",
  ariaLabel,
  ariaBusy,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  full?: boolean;
  className?: string;
  type?: "button" | "submit";
  ariaLabel?: string;
  ariaBusy?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-busy={ariaBusy}
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${full ? "w-full" : ""} font-display font-bold transition disabled:opacity-40 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-paper ${className}`}
    >
      {children}
    </button>
  );
}

type ScreenCardVariant = "flat" | "elevated" | "selected";

const screenCardVariants: Record<ScreenCardVariant, string> = {
  flat: "bg-paper border border-line",
  elevated: "bg-paper border border-line shadow-soft",
  selected: "bg-teal/5 border-2 border-teal ring-4 ring-teal/10",
};

// M25: this is a DIFFERENT visual language from dc.tsx's `Card` (rounded-3xl +
// soft/selected states here vs a fixed rounded-[20px] hard-shadow "paper"
// look there) — not a duplicate to merge, just named distinctly so an import
// makes clear which system a screen is drawing from. dc.tsx's Card is the one
// DESIGN-SYSTEM.md calls canonical for new work; this one is the general
// screen-content card used across Home/LessonPlayer/Fingerspell/DevMetrics/
// InfoPages.
export function ScreenCard({
  children,
  className = "",
  onClick,
  variant = "flat",
  ariaPressed,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: ScreenCardVariant;
  ariaPressed?: boolean;
  ariaLabel?: string;
}) {
  const base = `${screenCardVariants[variant]} rounded-3xl ${className}`;
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={ariaPressed}
        aria-label={ariaLabel}
        className={`${base} text-start w-full transition active:scale-[.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal`}
      >
        {children}
      </button>
    );
  }
  return <div className={base}>{children}</div>;
}

// M25: dc.tsx's Pill is a strict superset (same props, 2 extra tones) — no
// second implementation to maintain.
export { Pill } from "./dc";

/** Daily-goal / progress ring (SVG, brand gold on teal track). */
export function ProgressRing({
  progress, // 0..1
  size = 64,
  stroke = 7,
  children,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  // Guard NaN (e.g. a 0/0 daily-goal ratio for a brand-new user) → empty ring,
  // never a NaN strokeDashoffset (React warns + the arc fails to render).
  const clamped = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#0F6E6A" strokeOpacity="0.12" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={clamped >= 1 ? "#E6B24C" : "#0F6E6A"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          style={{ transition: "stroke-dashoffset .6s ease, stroke .3s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

// ── Added for the redesign (spec §3/§4) — additive primitives ────────────────

/** Profile avatar — emoji glyph in a brand chip. Used by the shared header. */
export function Avatar({
  emoji,
  size = "md",
  className = "",
}: {
  emoji: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = { sm: "h-8 w-8 text-base", md: "h-10 w-10 text-lg", lg: "h-14 w-14 text-2xl" }[size];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 border-paper bg-sand ${dims} ${className}`}
      aria-hidden="true"
    >
      {emoji}
    </span>
  );
}

/** Notification dot / count bubble — e.g. family-request count on the profile button. */
export function Badge({
  count,
  lang,
  className = "",
}: {
  count?: number;
  /** L12: Eastern-Arabic digits in ar. Omit for langless call sites (Latin). */
  lang?: "en" | "ar";
  className?: string;
}) {
  if (count !== undefined && count <= 0) return null;
  const shown =
    count === undefined ? "" : count > 9 ? (lang === "ar" ? "٩+" : "9+") : toLocaleDigits(count, lang ?? "en");
  return (
    <span
      className={`inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-coral-deep px-1 font-display text-[10px] font-bold leading-none text-white ${className}`}
      aria-hidden="true"
    >
      {shown}
    </span>
  );
}

/** Typed text primitives (spec §4.2) — one type ramp instead of per-screen ad-hoc sizes.
 *  Eyebrow drops uppercase/tracking in Arabic (uppercasing Arabic is wrong). */
export function Title({
  children,
  className = "",
  as: As = "h2",
}: {
  children: ReactNode;
  className?: string;
  /** M17: most screens use Title as a secondary heading (h2); a screen with
   *  no other <h1> (e.g. AllSigns) can promote its page title to h1. */
  as?: "h1" | "h2";
}) {
  return <As className={`font-display text-2xl font-bold leading-tight text-ink md:text-3xl ${className}`}>{children}</As>;
}
export function Eyebrow({
  children,
  lang,
  className = "",
}: {
  children: ReactNode;
  lang?: "en" | "ar";
  className?: string;
}) {
  const latin = lang !== "ar" ? "uppercase tracking-wide" : "";
  return <p className={`font-display text-xs font-bold text-teal ${latin} ${className}`}>{children}</p>;
}
