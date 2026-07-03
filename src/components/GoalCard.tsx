// GoalCard — the single daily-goal widget (spec §3).
// Replaces Home's two bespoke goal widgets (mobile ring+bar vs desktop bar-only).
// Reskinned to the Celebrations "goal met" language (Celebrations.dc.html · GOAL):
// when the goal is met the ring pops a gold-on-teal checkmark instead of a number,
// tying the Home widget to the full-screen goal celebration.
// Keeps the Math.max(6,…) fill floor so an empty bar still reads as a track.
import type { Lang } from "../types";
import { formatPercent } from "./dc";
import { ScreenCard, ProgressRing } from "./ui";

export function GoalCard({
  label,
  caption,
  progress,
  done = false,
  onClick,
  lang,
}: {
  label: string;
  caption: string;
  /** 0..1 (unclamped ok — ProgressRing clamps) */
  progress: number;
  /** show the "all done" gold state */
  done?: boolean;
  /** optional tap target (practice-first: routes to camera) */
  onClick?: () => void;
  /** UI language — localizes the percent (Eastern-Arabic digits in AR). Falls back to
   *  the document's active language when the caller omits it, so the ring never mixes
   *  Latin digits with an Arabic caption (HANDOFF §2 · never mix scripts). */
  lang?: Lang;
}) {
  const resolvedLang: Lang =
    lang ?? (typeof document !== "undefined" && document.documentElement.lang === "ar" ? "ar" : "en");
  const pct = Math.round(Math.min(1, progress) * 100);
  return (
    <ScreenCard variant="elevated" onClick={onClick} className="flex items-center gap-4 p-5">
      <ProgressRing progress={progress} size={64} stroke={7}>
        {done ? (
          // Goal-met check — physical glyph, never mirrors (HANDOFF §2). Springs in.
          <span
            className="animate-pop block rounded-[2px] border-b-[4px] border-l-[4px] border-teal"
            style={{ width: 20, height: 11, transform: "rotate(-45deg) translateY(-1px)" }}
            aria-hidden="true"
          />
        ) : (
          <span className="font-display text-sm font-black text-teal">{formatPercent(pct, resolvedLang)}</span>
        )}
      </ProgressRing>
      <div className="min-w-0 flex-1">
        <p className="font-display font-bold text-ink">{label}</p>
        <p className="text-sm text-muted">{caption}</p>
        <div
          className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-ink/10"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${done ? "bg-gold" : "bg-teal"}`}
            style={{ width: `${Math.max(6, Math.min(1, progress) * 100)}%` }}
          />
        </div>
      </div>
    </ScreenCard>
  );
}
