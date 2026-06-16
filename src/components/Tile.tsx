// Tile / Chip — the ONE selectable affordance (spec §3, §4.5).
// Replaces the per-screen coral-vs-gold-vs-nothing selection drift. Every choice
// surface (onboarding personas/hand/goal/picker, camera target chips, filters)
// uses this: uniform selected ring + check badge + aria-pressed.
import type { ReactNode } from "react";
import { Icon } from "./ui";

type TileState = "idle" | "trained";

/** Big selectable card (onboarding choices, picker options). */
export function Tile({
  children,
  selected = false,
  onClick,
  ariaLabel,
  className = "",
}: {
  children: ReactNode;
  selected?: boolean;
  onClick: () => void;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={ariaLabel}
      className={`relative flex w-full items-center gap-4 rounded-3xl border-2 p-5 text-start transition active:scale-[.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
        selected
          ? "border-teal bg-teal/5 ring-4 ring-teal/10"
          : "border-line bg-paper hover:border-teal/40"
      } ${className}`}
    >
      {children}
      {selected && (
        <span className="absolute end-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-teal text-white" aria-hidden="true">
          <Icon name="check" className="text-lg" />
        </span>
      )}
    </button>
  );
}

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
