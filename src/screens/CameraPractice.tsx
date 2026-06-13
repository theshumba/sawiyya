// Standalone camera practice — "Practise the alphabet" (PRD §7, §8).
// Pick a letter or gradable sign → teach the camera once → live grading.
// Visuals mirror design/stitch-v2-brand practise-the-alphabet--mobile.
import { useState } from "react";
import { num, pick, t } from "../i18n";
import { ALPHABET, A1_SIGNS, signById } from "../content/signs";
import { activeProfile, useApp } from "../store/app";
import { useUi } from "../store/ui";
import { isTrained } from "../recognizer/knn";
import { CameraTrainer } from "../components/CameraTrainer";
import { Confetti, celebrate } from "../components/Confetti";
import { Icon, Pill } from "../components/ui";

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
      <header className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">{t("camPractice", lang)}</h1>
        <div className="flex shrink-0 items-center gap-2">
          <Pill tone="gold" className="!py-1">
            <Icon name="stars" fill className="text-base leading-none text-gold" />
            <span className="font-display">
              {num(profile.xpToday, lang)} {t("xp", lang)}
            </span>
          </Pill>
          <button
            type="button"
            onClick={() => go({ name: "home" })}
            aria-label={t("back", lang)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-teal/10 text-teal"
          >
            <Icon name="close" className="text-xl leading-none" />
          </button>
        </div>
      </header>

      {/* word signs (gradable statics) */}
      <div className="no-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5 pb-3">
        {GRADABLE_SIGNS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setSignId(s.id);
              setRound((r) => r + 1);
            }}
            className={`flex shrink-0 items-center gap-1.5 rounded-2xl px-4 py-2.5 font-display text-sm font-bold transition active:scale-95 ${
              s.id === signId
                ? "bg-coral text-white shadow-lg ring-4 ring-coral ring-offset-2 ring-offset-sand"
                : isTrained(s.id)
                  ? "bg-gold text-white shadow-md"
                  : "border-2 border-teal bg-transparent text-teal opacity-80"
            }`}
          >
            {pick(lang, s.glossEn, s.glossAr)}
            {isTrained(s.id) && s.id !== signId && (
              <Icon name="star" fill className="text-sm leading-none text-white" />
            )}
          </button>
        ))}
      </div>

      {/* alphabet strip */}
      <div className="no-scrollbar -mx-5 mb-4 flex gap-2 overflow-x-auto px-5 py-2" dir="rtl">
        {ALPHABET.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setSignId(s.id);
              setRound((r) => r + 1);
            }}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-display text-xl font-bold transition active:scale-95 ${
              s.id === signId
                ? "bg-coral text-white shadow-lg ring-4 ring-coral ring-offset-2 ring-offset-sand"
                : isTrained(s.id)
                  ? "bg-gold text-white shadow-md"
                  : "border-2 border-teal bg-transparent text-teal opacity-70"
            }`}
            aria-label={s.glossEn}
          >
            {s.code}
          </button>
        ))}
      </div>

      <CameraTrainer key={`${signId}-${round}`} sign={sign} lang={lang} onResult={handleResult} />
    </div>
  );
}
