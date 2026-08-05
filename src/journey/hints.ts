// The hint budget: one hint per session, never on the screen the app launched
// on (plan point 8). Front-loaded tours tested worse than nothing, so a hint has
// to be earned by the learner arriving somewhere empty of their own accord.
//
// The budget is module state on purpose. It must NOT persist: "one per session"
// means one per app open, and a persisted counter would spend the budget on a
// screen the learner closed a week ago.
import { useEffect, useState } from "react";
import { HINTS, isUnseen, type Hint, type HintPlace } from "./journey";
import { useApp } from "../store/app";
import { useUi } from "../store/ui";

let spent = false;
/** How many times the learner has moved this session. Zero means we are still on
 *  the screen the app opened on, which is the one screen a hint may never
 *  interrupt. The ui store only changes on go() / popstate / hashchange. */
let navigations = 0;

if (typeof window !== "undefined") {
  useUi.subscribe(() => {
    navigations += 1;
  });
}

/**
 * Claim this session's one hint for `place`, or null. Mutates module state, so
 * it belongs in an effect, never in a render pass.
 */
export function claimHint(place: HintPlace, seen: Record<string, number>): Hint | null {
  if (spent || navigations === 0) return null;
  const hint = HINTS.find((h) => h.place === place && isUnseen(h.id, h.rev, seen));
  if (!hint) return null;
  spent = true;
  return hint;
}

/** Test seam — a module-level budget cannot otherwise be re-run. */
export function resetHintBudget(nav = 0): void {
  spent = false;
  navigations = nav;
}

/**
 * The one hint this empty state may show, or null. `active` is the empty-state
 * condition itself: a screen with content must not spend the session's budget.
 */
export function useHint(place: HintPlace, active: boolean): Hint | null {
  const [hint, setHint] = useState<Hint | null>(null);
  const ackHint = useApp((s) => s.ackHint);

  useEffect(() => {
    if (!active || hint) return;
    // Read `seen` off the store rather than subscribing to it: acknowledging the
    // hint writes to that very map, and a subscription would re-run this effect
    // against its own write.
    const claimed = claimHint(place, useApp.getState().journey.seen);
    if (!claimed) return;
    setHint(claimed);
    ackHint(claimed.id, claimed.rev);
  }, [place, active, hint, ackHint]);

  return hint;
}
