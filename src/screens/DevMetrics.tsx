// Hidden dev-metrics screen for the pitch (PRD §15). Local-only counters —
// no external tracking exists anywhere in the app.
import { useApp } from "../store/app";
import { useUi } from "../store/ui";
import { userTaughtClassIds } from "../recognizer/knn";
import { Card } from "../components/ui";

export function DevMetrics() {
  const app = useApp();
  const { go } = useUi();
  const m = app.metrics;
  const matchRate = m.cameraAttempts > 0 ? Math.round((m.cameraMatches / m.cameraAttempts) * 100) : null;
  const selfMarkRate = m.drillsCompleted > 0 ? Math.round((m.selfMarks / m.drillsCompleted) * 100) : 0;
  const ttfs = m.firstSignMs !== null ? `${Math.round(m.firstSignMs / 1000)}s` : "—";

  const rows: [string, string][] = [
    ["Time to first sign (G1, target <180s)", ttfs],
    ["Drills completed", String(m.drillsCompleted)],
    ["Lessons completed", String(m.lessonsCompleted)],
    ["Camera attempts (graded)", String(m.cameraAttempts)],
    ["Camera match rate", matchRate === null ? "—" : `${matchRate}%`],
    ["…of which own-recording (KNN, not model)", String(m.ownRecordingMatches)],
    ["Self-mark rate", `${selfMarkRate}%`],
    ["Handshapes you've taught (excl. seeds)", String(userTaughtClassIds().length)],
    ["Profiles", String(app.profiles.length)],
    ["Active flags", String(app.flags.filter((f) => f.active).length)],
    ["App first opened", m.appFirstOpenAt ? new Date(m.appFirstOpenAt).toLocaleString() : "—"],
  ];

  return (
    <div className="mx-auto max-w-md px-5 pb-12 pt-6" dir="ltr">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dev metrics 🔧</h1>
        <button
          type="button"
          onClick={() => go({ name: "settings" })}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-teal/10 text-lg"
        >
          ✕
        </button>
      </header>
      <p className="mt-1 text-sm text-muted">Local-only counters. Nothing here is transmitted anywhere.</p>
      <Card className="mt-5 divide-y divide-line">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 px-4 py-3">
            <span className="text-sm font-medium text-muted">{label}</span>
            <span className="font-display font-bold">{value}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
