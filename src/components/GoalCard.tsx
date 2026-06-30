// GoalCard — the single daily-goal widget (spec §3).
// Replaces Home's two bespoke goal widgets (mobile ring+bar vs desktop bar-only).
// Keeps the Math.max(6,…) fill floor so an empty bar still reads as a track.
import { Card, ProgressRing } from "./ui";

export function GoalCard({
  label,
  caption,
  progress,
  done = false,
  onClick,
}: {
  label: string;
  caption: string;
  /** 0..1 (unclamped ok — ProgressRing clamps) */
  progress: number;
  /** show the "all done" gold state */
  done?: boolean;
  /** optional tap target (practice-first: routes to camera) */
  onClick?: () => void;
}) {
  const pct = Math.round(Math.min(1, progress) * 100);
  return (
    <Card variant="elevated" onClick={onClick} className="flex items-center gap-4 p-5">
      <ProgressRing progress={progress} size={64} stroke={7}>
        <span className={`font-display text-sm font-black ${done ? "text-gold" : "text-teal"}`}>{pct}%</span>
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
    </Card>
  );
}
