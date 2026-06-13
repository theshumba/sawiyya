// First-sign-in-3-min — the hook and the demo open (PRD §6.2, G1).
// Learn ONE sign ("I love you / أحبك") → film it → gold celebration.
// Visuals mirror first-sign-watch + celebration-connection-made (stitch-v2-brand).
import { useState } from "react";
import { pick, t } from "../i18n";
import { signById } from "../content/signs";
import { activeProfile, useApp } from "../store/app";
import { useUi } from "../store/ui";
import { CameraTrainer, type TrainerResult } from "../components/CameraTrainer";
import { Confetti, celebrate } from "../components/Confetti";
import { SignDemo } from "../components/SignDemo";
import { Button, Icon } from "../components/ui";

type Step = "watch" | "try" | "celebrate";

const STEPS: { id: Step; icon: string; en: string; ar: string }[] = [
  { id: "watch", icon: "visibility", en: "Watch", ar: "شاهد" },
  { id: "try", icon: "front_hand", en: "Try", ar: "جرّب" },
  { id: "celebrate", icon: "celebration", en: "Win", ar: "افرح" },
];

function StepDots({ step, lang }: { step: Step; lang: "en" | "ar" }) {
  const activeIdx = STEPS.findIndex((s) => s.id === step);
  return (
    <div className="flex items-center justify-center gap-6">
      {STEPS.map((s, i) => {
        const active = i === activeIdx;
        const done = i < activeIdx;
        return (
          <div key={s.id} className="flex items-center gap-6">
            {i > 0 && <span className="-mt-6 h-1 w-10 rounded-full bg-ink/10" aria-hidden="true" />}
            <div className="flex flex-col items-center gap-2">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  active
                    ? "animate-pulse-ring border-4 border-white bg-gold text-white shadow-gold"
                    : done
                      ? "bg-teal text-white"
                      : "bg-ink/10 text-ink/30"
                }`}
              >
                <Icon name={s.icon} fill={active || done} className="text-xl leading-none" />
              </span>
              <span
                className={`text-[10px] font-display font-bold uppercase tracking-widest ${
                  active ? "text-gold" : done ? "text-teal" : "text-ink/30"
                }`}
              >
                {pick(lang, s.en, s.ar)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

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
    <div className={`min-h-screen w-full ${step === "celebrate" ? "bg-teal" : ""}`}>
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-8">
        <Confetti burst={burst} />

        {step === "watch" && (
          <>
            <p className="font-display text-xl font-bold text-ink/80">{t("fsIntro", lang)}</p>
            <h1 className="mt-1 font-display text-4xl font-extrabold leading-tight tracking-tight text-teal">
              {pick(lang, sign.glossEn, sign.glossAr)}
              <span className="mx-2 text-muted">·</span>
              <span dir={lang === "ar" ? "ltr" : "rtl"}>
                {pick(lang === "ar" ? "en" : "ar", sign.glossEn, sign.glossAr)}
              </span>
            </h1>
            <div className="mt-6">
              <SignDemo sign={sign} lang={lang} />
            </div>
            <div className="mt-8">
              <StepDots step="watch" lang={lang} />
            </div>
            <div className="mt-auto pt-6">
              <Button full onClick={() => setStep("try")} className="!rounded-2xl !py-5 font-display text-xl">
                <span className="flex items-center justify-center gap-3">
                  {t("fsNowYou", lang)}
                  <img src="brand/stitch-54.png" alt="" aria-hidden="true" className="h-8 w-8 object-contain" />
                </span>
              </Button>
            </div>
          </>
        )}

        {step === "try" && (
          <>
            <h1 className="mb-4 text-center font-display text-2xl font-bold">{t("fsNowYou", lang)}</h1>
            <CameraTrainer sign={sign} lang={lang} onResult={handleResult} autoStart />
          </>
        )}

        {step === "celebrate" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center text-white">
            {/* gold starburst hero with floating XP chip */}
            <div className="relative flex w-full items-center justify-center">
              <img
                src="brand/stitch-22.png"
                alt=""
                aria-hidden="true"
                className="animate-pop-in w-4/5 max-w-xs drop-shadow-2xl"
              />
              <div className="extruded-gold animate-rise absolute top-4 end-6 flex rotate-12 items-center gap-1.5 rounded-2xl bg-gold px-5 py-2">
                <span className="font-display text-xl font-bold text-teal-deep">+10</span>
                <span className="font-display text-[10px] font-bold tracking-tight text-teal-deep">
                  {t("xp", lang)}
                </span>
              </div>
            </div>

            <h1
              className="animate-rise mt-6 font-display text-4xl font-bold leading-tight text-gold"
              style={{ textShadow: "0 0 20px rgba(230,178,76,.6)" }}
            >
              وصلت!
              <br />
              <span className="text-white opacity-95">{t("fsCelebrate", "en")}</span>
            </h1>
            <p className="animate-rise mx-auto mt-4 max-w-[280px] text-lg font-medium leading-relaxed text-sand/90">
              {t("fsDone", lang)}
            </p>

            <div className="mt-10 w-full">
              <Button
                full
                variant="gold"
                onClick={() => go({ name: "home" })}
                className="!rounded-2xl !py-5 font-display text-xl !text-teal-deep"
              >
                <span className="flex items-center justify-center gap-3">
                  {t("fsKeepGoing", lang)}
                  <Icon name="arrow_forward" className="text-xl font-bold leading-none rtl:rotate-180" />
                </span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
