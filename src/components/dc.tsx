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

/** Fill + deep-tone spring-shadow classes (HANDOFF §Shape). Ghost = flat sand. */
const springFill: Record<SpringVariant, string> = {
  teal: "bg-teal text-paper spring spring-teal",
  coral: "bg-coral text-paper spring spring-coral",
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
}

/** 11px/700 uppercase mono label, letter-spacing .12em (HANDOFF §Type · mono). */
export function MonoLabel({ children, className = "" }: MonoLabelProps) {
  return (
    <span
      className={`font-mono text-[11px] font-bold uppercase leading-none tracking-[0.12em] ${className}`}
    >
      {children}
    </span>
  );
}

// ── OnDeviceBadge ────────────────────────────────────────────────────────────

const ON_DEVICE_LABEL: Record<Lang, string> = {
  en: "On-device · nothing leaves your phone",
  ar: "على جهازك · لا شيء يغادر هاتفك",
};

export interface OnDeviceBadgeProps {
  lang: Lang;
  className?: string;
}

/**
 * The always-visible on-device privacy badge for camera frames. Dark #16302E
 * pill, green live-dot + lock glyph (glyph never mirrors — HANDOFF §2) + label.
 */
export function OnDeviceBadge({ lang, className = "" }: OnDeviceBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full bg-ink px-3 py-1.5 ${className}`}
      role="note"
      aria-label={ON_DEVICE_LABEL[lang]}
    >
      <span className="h-2 w-2 shrink-0 rounded-full bg-[#7BE0A0]" aria-hidden="true" />
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
        style={{ direction: "ltr" }}
      >
        <rect x="4" y="10" width="16" height="11" rx="2.5" fill="#FBF7EF" />
        <path
          d="M8 10V7.5a4 4 0 1 1 8 0V10"
          stroke="#FBF7EF"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span className="font-sans text-[11px] font-semibold leading-none text-paper">
        {ON_DEVICE_LABEL[lang]}
      </span>
    </span>
  );
}

// ── ConfidenceRing ───────────────────────────────────────────────────────────

export interface ConfidenceRingProps {
  /** 0..1 fill. Clamped; non-finite → 0. */
  value: number;
  lang: Lang;
  size?: number;
  stroke?: number;
  className?: string;
}

/**
 * Live confidence ring — gold arc fills 0→100% from `value`. Centre shows the
 * localized percent (Eastern-Arabic digits + ٪ for `ar`). HANDOFF §1/§3.
 */
export function ConfidenceRing({
  value,
  lang,
  size = 96,
  stroke = 9,
  className = "",
}: ConfidenceRingProps) {
  const clamped = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = clamped * 100;
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#0F6E6A"
          strokeOpacity="0.12"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#E6B24C"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          style={{ transition: "stroke-dashoffset .3s linear" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display font-bold text-ink">
        {formatPercent(pct, lang)}
      </span>
    </div>
  );
}
