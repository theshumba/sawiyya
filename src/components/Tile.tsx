// Chip: the small selectable affordance (camera target chips, filter chips).
// Uniform selected fill + check/star badge + aria-pressed.
//
// This file used to export a big-card sibling called `Tile`, documented as "the
// ONE selectable affordance". It had zero call sites while eight screens
// hand-rolled their own selected treatment, so it was documentation that no
// screen honoured. It is gone. Adopting one selection treatment across those
// screens is a real job, not a dead export, and is tracked separately.
import type { ReactNode } from "react";
import { Icon } from "./ui";

type TileState = "idle" | "trained";

/** Small selectable pill/square (camera target chips, filter chips). */
export function Chip({
  children,
  selected = false,
  state = "idle",
  onClick,
  ariaLabel,
  className = "",
}: {
  children: ReactNode;
  selected?: boolean;
  state?: TileState;
  onClick: () => void;
  ariaLabel?: string;
  className?: string;
}) {
  const tone = selected
    ? "border-coral bg-coral text-white ring-4 ring-coral/15"
    : state === "trained"
      ? "border-gold/50 bg-gold/10 text-teal-deep"
      : "border-line bg-paper text-ink/70 hover:border-teal/40";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={ariaLabel}
      className={`relative inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl border-2 px-4 py-2.5 font-display font-bold transition active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${tone} ${className}`}
    >
      {children}
      {state === "trained" && !selected && (
        <Icon name="star" fill className="text-sm text-gold" />
      )}
    </button>
  );
}
