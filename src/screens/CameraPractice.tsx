// Standalone camera practice — "Practise the alphabet" (PRD §7, §8).
// Pick a letter or gradable sign → teach the camera once → live grading.
import { useState } from "react";
import { num, pick, t } from "../i18n";
import { ALPHABET, A1_SIGNS, signById } from "../content/signs";
import { activeProfile, useApp } from "../store/app";
import { useUi } from "../store/ui";
import { isTrained } from "../recognizer/knn";
import { CameraTrainer } from "../components/CameraTrainer";
import { Confetti, celebrate } from "../components/Confetti";
import { Pill } from "../components/ui";

const GRADABLE_SIGNS = A1_SIGNS.filter((s) => s.cameraGradable);

export function CameraPractice({ initialSignId }: { initialSignId?: string }) {
  const app = useApp();
  const { go } = useUi();
  const profile = activeProfile(app);
  const [signId, setSignId] = useState(initialSignId ?? "alpha-alif");
  const [burst, setBurst] = useState(0);
  // remount the trainer when the target (or a completed round) changes
  const [round, setRound] = useState(0);
  if (!profile) return null;
  const lang = profile.language;
  const sign = signById(signId);
  if (!sign) return null;

  const handleResult = (result: "match" | "selfMark" | "skip") => {
    if (result === "skip") {
      setRound((r) => r + 1);
      return;
    }
    app.recordDrillResult(signId, "good", {
      camera: result === "match",
      matched: result === "match",
      selfMark: result === "selfMark",
    });
    if (result === "match") {
      celebrate();
      setBurst((b) => b + 1);
    }
    setTimeout(() => setRound((r) => r + 1), result === "match" ? 600 : 0);
  };

  return (
    <div className="mx-auto max-w-md px-5 pb-28 pt-6">
      <Confetti burst={burst} />
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("camPractice", lang)}</h1>
        <button
          type="button"
          onClick={() => go({ name: "home" })}
          aria-label={t("back", lang)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-teal/10 text-lg"
        >
          ✕
        </button>
      </header>

      {/* word signs (gradable statics) */}
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-3">
        {GRADABLE_SIGNS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setSignId(s.id);
              setRound((r) => r + 1);
            }}
            className={`flex shrink-0 items-center gap-1.5 rounded-2xl border-2 px-3.5 py-2 text-sm font-bold transition ${
              s.id === signId
                ? "border-teal bg-teal text-white"
                : "border-line bg-paper text-ink"
            }`}
          >
            <span aria-hidden="true">{s.emoji}</span>
            {pick(lang, s.glossEn, s.glossAr)}
            {isTrained(s.id) && <span className="text-gold" aria-hidden="true">●</span>}
          </button>
        ))}
      </div>

      {/* alphabet strip */}
      <div className="no-scrollbar -mx-5 mb-4 flex gap-1.5 overflow-x-auto px-5 pb-2" dir="rtl">
        {ALPHABET.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setSignId(s.id);
              setRound((r) => r + 1);
            }}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 text-lg font-bold transition ${
              s.id === signId
                ? "border-teal bg-teal text-white"
                : isTrained(s.id)
                  ? "border-gold/60 bg-gold/10 text-ink"
                  : "border-line bg-paper text-ink"
            }`}
            aria-label={s.glossEn}
          >
            {s.code}
          </button>
        ))}
      </div>

      <CameraTrainer key={`${signId}-${round}`} sign={sign} lang={lang} onResult={handleResult} />

      <div className="mt-4 flex items-center justify-between">
        <Pill tone="muted">{t("camPrivacy", lang)}</Pill>
        <Pill tone="gold">
          ⚡ {num(profile.xpToday, lang)} {t("xp", lang)}
        </Pill>
      </div>
    </div>
  );
}
