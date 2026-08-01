// dc.tsx — shared design-system primitives for the Sawiyya reskin.
// Every value is lifted literally from the .dc.html references (HANDOFF §1–§3).
// All primitives are RTL-safe via CSS logical properties and are fully typed.
//
// Contract: see design/rebuild-source/DESIGN-SYSTEM.md.
import type { CSSProperties, ReactNode } from "react";
import type { Lang } from "../types";

// ── helpers ──────────────────────────────────────────────────────────────────

const EASTERN = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"] as const;

/** Render an integer with Eastern-Arabic glyphs for `ar`, Latin for `en`. */
export function toLocaleDigits(n: number, lang: Lang): string {
  const s = String(n);
  return lang === "ar" ? s.replace(/[0-9]/g, (d) => EASTERN[Number(d)]) : s;
}

/** "50%" in EN, "٥٠٪" in AR (percent trails in both — HANDOFF §2). */
export function formatPercent(pct: number, lang: Lang): string {
  const n = toLocaleDigits(Math.round(pct), lang);
  return lang === "ar" ? `${n}٪` : `${n}%`;
}

// ── SpringButton ─────────────────────────────────────────────────────────────

export type SpringVariant = "teal" | "coral" | "gold" | "ghost";
export type SpringSize = "sm" | "md" | "lg";

/** Fill + deep-tone spring-shadow classes (HANDOFF §Shape). Ghost = flat sand.
 *  H15: paper-on-coral (DEFAULT #E8654C) measured 3.28:1 — below AA 4.5:1;
 *  coral-deep (#B54834) holds the same hue at 4.99:1 for paper / 5.33:1 for white. */
const springFill: Record<SpringVariant, string> = {
  teal: "bg-teal text-paper spring spring-teal",
  coral: "bg-coral-deep text-paper spring spring-coral",
  gold: "bg-gold text-ink spring spring-gold",
  ghost: "bg-sand text-ink border border-line",
};

const springSize: Record<SpringSize, string> = {
  sm: "text-sm px-4 py-3 min-h-[44px] rounded-xl",
  md: "text-base px-7 py-4 min-h-[48px] rounded-xl",
  lg: "text-lg px-8 py-4 min-h-[56px] rounded-2xl",
};

export interface SpringButtonProps {
  children: ReactNode;
  variant?: SpringVariant;
  size?: SpringSize;
  disabled?: boolean;
  full?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  ariaLabel?: string;
}

/**
 * The signature button: solid fill + hard 5px bottom shadow (no blur). On press
 * it drops 4px and the shadow shrinks to 1px (CSS `:active`, `src/styles.css`).
 * ≥44px hit target. prefers-reduced-motion zeroes the transition (global rule).
 */
export function SpringButton({
  children,
  variant = "teal",
  size = "md",
  disabled,
  full,
  onClick,
  type = "button",
  className = "",
  ariaLabel,
}: SpringButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 border-0 font-display font-bold leading-none ${springFill[variant]} ${springSize[size]} ${full ? "w-full" : ""} disabled:opacity-40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-sand ${className}`}
    >
      {children}
    </button>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────

const CARD_SHADOW: CSSProperties = { boxShadow: "0 2px 0 #EDE3D2" };

export interface CardProps {
  children: ReactNode;
  className?: string;
  /** Renders the card as a button when provided. */
  onClick?: () => void;
  ariaPressed?: boolean;
  ariaLabel?: string;
}

/** Paper surface: #FBF7EF bg, 1px #EDE3D2 hairline, 20px radius, hard 0 2px 0 shadow. */
export function Card({ children, className = "", onClick, ariaPressed, ariaLabel }: CardProps) {
  const base = `bg-paper border border-line rounded-[20px] ${className}`;
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={ariaPressed}
        aria-label={ariaLabel}
        style={CARD_SHADOW}
        className={`${base} w-full text-start transition active:scale-[.99] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/60`}
      >
        {children}
      </button>
    );
  }
  return (
    <div style={CARD_SHADOW} className={base}>
      {children}
    </div>
  );
}

// ── Pill ─────────────────────────────────────────────────────────────────────

export type PillTone = "teal" | "gold" | "coral" | "muted" | "ink" | "success";

const pillTone: Record<PillTone, string> = {
  teal: "bg-teal/10 text-teal",
  gold: "bg-gold/20 text-ink",
  coral: "bg-coral/10 text-coral",
  muted: "bg-ink/5 text-muted",
  ink: "bg-ink text-paper",
  success: "bg-success/10 text-success",
};

export interface PillProps {
  children: ReactNode;
  tone?: PillTone;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
}

/** 99px-radius chip. Renders as a button when `onClick` is provided. */
export function Pill({ children, tone = "teal", className = "", onClick, ariaLabel }: PillProps) {
  const base = `inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${pillTone[tone]} ${className}`;
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={`${base} transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold/60`}
      >
        {children}
      </button>
    );
  }
  return <span className={base}>{children}</span>;
}

// ── MonoLabel ────────────────────────────────────────────────────────────────

export interface MonoLabelProps {
  children: ReactNode;
  className?: string;
  /** M20: uppercase + wide tracking severs Arabic cursive joins — drop both
   *  for `ar`, matching the guard Eyebrow already has. Omit for EN-only text. */
  lang?: Lang;
}

/**
 * 11px/700 small label, letter-spacing .12em. Named "Mono" for the .dc.html
 * reference, but the brand vendors no monospace face, so this renders in the
 * display face (Rubik) like Eyebrow does, instead of whatever monospace the
 * device happens to carry.
 */
export function MonoLabel({ children, className = "", lang }: MonoLabelProps) {
  const latin = lang !== "ar" ? "uppercase tracking-[0.12em]" : "";
  return (
    <span className={`font-display text-[11px] font-bold leading-none ${latin} ${className}`}>
      {children}
    </span>
  );
}

// ── Removed primitives ───────────────────────────────────────────────────────
//
// `OnDeviceBadge` and `ConfidenceRing` used to live here. Both had zero call
// sites while CameraTrainer drew its own privacy chip and its own ring, so they
// were a documented API the app never honoured.
//
// ConfidenceRing is deliberately NOT revived for CameraTrainer's hold ring:
// that ring is the hold-to-confirm timer with a check icon in the middle, while
// this one printed a live percentage and announced role="progressbar". Swapping
// them would show a number the design withholds and read out a bogus progress
// value to screen readers.
