// First-sign-in-3-min — the hook and the demo open (PRD §6.2, G1).
// Learn ONE sign ("I love you / أحبك") → film it → gold celebration.
import { useState } from "react";
import { pick, t } from "../i18n";
import { signById } from "../content/signs";
import { activeProfile, useApp } from "../store/app";
import { useUi } from "../store/ui";
import { CameraTrainer, type TrainerResult } from "../components/CameraTrainer";
import { Confetti, celebrate } from "../components/Confetti";
import { SignDemo } from "../components/SignDemo";
import { Button, Logo } from "../components/ui";

type Step = "watch" | "try" | "celebrate";

export function FirstSign() {
  const app = useApp();
  const { go } = useUi();
  const [step, setStep] = useState<Step>("watch");
  const [burst, setBurst] = useState(0);
  const profile = activeProfile(app);
  const sign = signById("iloveyou");
  if (!profile || !sign) return null;
  const lang = profile.language;

  const handleResult = (result: TrainerResult) => {
    app.recordDrillResult(sign.id, "good", {
      camera: result === "match",
      matched: result === "match",
      selfMark: result === "selfMark",
    });
    app.markFirstSignTime(); // time-to-first-sign metric (G1)
    celebrate();
    setBurst((b) => b + 1);
    setStep("celebrate");
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-8">
      <Confetti burst={burst} />

      {step === "watch" && (
        <>
          <p className="text-center text-muted">{t("fsIntro", lang)}</p>
          <h1 className="mt-1 text-center text-3xl font-bold text-teal">
            {pick(lang, sign.glossEn, sign.glossAr)}
            <span className="mx-2 text-muted">·</span>
            <span dir={lang === "ar" ? "ltr" : "rtl"}>
              {pick(lang === "ar" ? "en" : "ar", sign.glossEn, sign.glossAr)}
            </span>
          </h1>
          <div className="mt-6">
            <SignDemo sign={sign} lang={lang} />
          </div>
          <div className="mt-auto pt-6">
            <Button full onClick={() => setStep("try")}>
              {t("fsNowYou", lang)} 🤟
            </Button>
          </div>
        </>
      )}

      {step === "try" && (
        <>
          <h1 className="mb-4 text-center text-2xl font-bold">{t("fsNowYou", lang)}</h1>
          <CameraTrainer sign={sign} lang={lang} onResult={handleResult} autoStart />
        </>
      )}

      {step === "celebrate" && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="animate-pop-in flex h-32 w-32 items-center justify-center rounded-full bg-gold shadow-gold">
            <span className="text-6xl" aria-hidden="true">🤟</span>
          </div>
          <h1 className="animate-rise mt-6 text-3xl font-bold text-teal">
            {t("fsCelebrate", lang)}
          </h1>
          <p className="animate-rise mt-3 max-w-xs text-lg text-muted">{t("fsDone", lang)}</p>
          <div className="mt-10 w-full">
            <Button full variant="gold" onClick={() => go({ name: "home" })}>
              {t("fsKeepGoing", lang)} →
            </Button>
          </div>
          <div className="mt-8 opacity-50">
            <Logo size={40} />
          </div>
        </div>
      )}
    </div>
  );
}
