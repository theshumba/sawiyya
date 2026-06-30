// Standalone camera practice — "Practise the alphabet" (PRD §7, §8).
// Pick a letter or gradable sign → teach the camera once → live grading.
// Practise-tab destination: opened pre-targeted by the PractiseChooser.
// Nav lives in the shared ScreenShell/AppNav; the XP pill lives on the profile button.
import { useState } from "react";
import { pick, t } from "../i18n";
import { ALPHABET, A1_SIGNS, signById } from "../content/signs";
import { activeProfile, useApp } from "../store/app";
import { useUi } from "../store/ui";
import { isTrained } from "../recognizer/knn";
import { CameraTrainer } from "../components/CameraTrainer";
import { Confetti, celebrate } from "../components/Confetti";
import { Icon, Title } from "../components/ui";
import { Chip } from "../components/Tile";
import { ScreenShell } from "../components/ScreenShell";
import { NoProfileFallback } from "../components/NoProfileFallback";

const GRADABLE_SIGNS = A1_SIGNS.filter((s) => s.cameraGradable);

export function CameraPractice({ initialSignId }: { initialSignId?: string }) {
  const app = useApp();
  const { go } = useUi();
  const profile = activeProfile(app);
  const [signId, setSignId] = useState(initialSignId ?? "alpha-alif");
  const [burst, setBurst] = useState(0);
  // remount the trainer when the target (or a completed round) changes
  const [round, setRound] = useState(0);
  if (!profile) return <NoProfileFallback />;
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

  // pick a new target → remount the trainer
  const choose = (id: string) => {
    setSignId(id);
    setRound((r) => r + 1);
  };

  return (
    <ScreenShell lang={lang} chrome="tabs">
      <div className="mx-auto max-w-md px-5 pt-6 md:max-w-5xl md:px-8 md:pt-10">
        <Confetti burst={burst} />

        <header className="mb-5 flex items-center justify-between gap-3">
          <Title>{t("camPractice", lang)}</Title>
          <button
            type="button"
            onClick={() => go({ name: "home" })}
            aria-label={t("back", lang)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-teal/70 transition hover:bg-teal/5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          >
            <Icon name="close" className="text-xl leading-none" />
          </button>
        </header>

        {/* ONE target switcher: gradable word signs + the Arabic alphabet,
            unified active / trained / idle via Chip + scroll-edge fades. */}
        <div className="relative mb-5">
          <div className="no-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5 py-2 md:mx-0 md:px-0">
            {GRADABLE_SIGNS.map((s) => (
              <Chip
                key={s.id}
                selected={s.id === signId}
                state={isTrained(s.id) ? "trained" : "idle"}
                onClick={() => choose(s.id)}
              >
                {pick(lang, s.glossEn, s.glossAr)}
              </Chip>
            ))}
            <span className="mx-1 self-center text-teal/20" aria-hidden="true">
              <Icon name="more_vert" className="text-lg leading-none" />
            </span>
            <div dir="rtl" className="flex gap-2">
              {ALPHABET.map((s) => (
                <Chip
                  key={s.id}
                  selected={s.id === signId}
                  state={isTrained(s.id) ? "trained" : "idle"}
                  onClick={() => choose(s.id)}
                  ariaLabel={s.glossEn}
                  className="h-12 w-12 px-0 text-xl"
                >
                  {s.code}
                </Chip>
              ))}
            </div>
          </div>
          {/* scroll-edge fades */}
          <span
            className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-sand to-transparent md:hidden"
            aria-hidden="true"
          />
          <span
            className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-sand to-transparent md:hidden"
            aria-hidden="true"
          />
        </div>

        <CameraTrainer key={`${signId}-${round}`} sign={sign} lang={lang} onResult={handleResult} />
      </div>
    </ScreenShell>
  );
}
