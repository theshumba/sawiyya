// Brand UI primitives — Sawiyya design system (Brand Identity §2–4).
// Soft geometry, meeting-curve radii, teal+coral anchors, gold celebration.
import type { ReactNode } from "react";

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

// Extruded "pressable" buttons — flat top face + hard darker bottom edge,
// depressing on :active (mirrored from the approved Stitch design).
const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-coral text-white extruded-coral",
  secondary: "bg-teal text-white extruded-teal",
  gold: "bg-gold text-ink extruded-gold",
  ghost: "bg-transparent text-teal border-2 border-teal/30 active:scale-[.98]",
};

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  full,
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  full?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variantClasses[variant]} ${full ? "w-full" : ""} font-display font-bold text-base rounded-2xl px-6 py-4 min-h-[52px] transition disabled:opacity-40 disabled:shadow-none ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const base = `bg-paper border border-line rounded-3xl ${className}`;
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base} text-start w-full transition active:scale-[.99]`}>
        {children}
      </button>
    );
  }
  return <div className={base}>{children}</div>;
}

export function Pill({
  children,
  tone = "teal",
  className = "",
}: {
  children: ReactNode;
  tone?: "teal" | "gold" | "coral" | "muted";
  className?: string;
}) {
  const tones = {
    teal: "bg-teal/10 text-teal",
    gold: "bg-gold/20 text-ink",
    coral: "bg-coral/10 text-coral",
    muted: "bg-ink/5 text-muted",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm font-semibold rounded-full px-3 py-1.5 ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

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
  const clamped = Math.max(0, Math.min(1, progress));
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

/** Lesson progress bar with the brand "meeting curve" fill. */
export function MeetingBar({ progress }: { progress: number }) {
  // Thick inset track, glossy gold fill with a leading glow (Stitch design).
  return (
    <div
      className="h-4 w-full rounded-full bg-ink/10 shadow-inner overflow-hidden"
      role="progressbar"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="relative h-full rounded-full bg-gold transition-all duration-500"
        style={{ width: `${Math.max(6, progress * 100)}%`, boxShadow: "0 0 10px rgba(230,178,76,.7)" }}
      >
        <span className="absolute inset-x-1.5 top-0.5 h-1 rounded-full bg-white/40" aria-hidden="true" />
      </div>
    </div>
  );
}
