// First-sign-in-3-min — the hook and the demo open (PRD §6.2, G1).
// Learn ONE sign ("I love you / أحبك") → film it → gold celebration.
// Visuals mirror first-sign-watch-i-love-you / -demo + celebration-connection-made (stitch-v2-brand).
//
// Redesign (§5.4): chrome-light onboarding takeover — NO global tab bar / profile button.
// ONE responsive tree (mobile-first) with a single source of truth for the
// watch → try → celebrate machine. One next action per step (single coral
// "Now you try"; the sidebar "Start Practice" duplicate is gone).
import { useState } from "react";
import { pick, t } from "../i18n";
import { signById } from "../content/signs";
import { activeProfile, useApp } from "../store/app";
import { useUi } from "../store/ui";
import { CameraTrainer, type TrainerResult } from "../components/CameraTrainer";
import { Confetti, celebrate } from "../components/Confetti";
import { ScreenShell } from "../components/ScreenShell";
import { Button, Icon } from "../components/ui";
import { SignDemo } from "../components/SignDemo";

type Step = "watch" | "try" | "celebrate";

const STEPS: { id: Step; icon: string; en: string; ar: string }[] = [
  { id: "watch", icon: "visibility", en: "Watch", ar: "شاهد" },
  { id: "try", icon: "front_hand", en: "Try", ar: "جرّب" },
  { id: "celebrate", icon: "emoji_events", en: "Celebrate", ar: "افرح" },
];

function StepDots({ step, lang }: { step: Step; lang: "en" | "ar" }) {
  const activeIdx = STEPS.findIndex((s) => s.id === step);
  return (
    <div className="flex items-center justify-center gap-6 sm:gap-8">
      {STEPS.map((s, i) => {
        const active = i === activeIdx;
        const done = i < activeIdx;
        return (
          <div key={s.id} className="flex items-center gap-6 sm:gap-8">
            {i > 0 && <span className="-mt-6 h-1 w-10 rounded-full bg-ink/10 sm:w-12" aria-hidden="true" />}
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
                className={`text-[10px] font-display font-extrabold uppercase tracking-widest ${
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
  // Onboarding hands users straight into camera practice with their real hand.
  // CameraTrainer shows the I-love-you reference chip ("the thing to copy") so
  // they still see the sign — but the very first thing they do is sign it.
  const [step, setStep] = useState<Step>("try");
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

  // "Share this moment" — Web Share where available, silently no-op otherwise.
  const shareMoment = () => {
    const shareData = {
      title: "Sawiyya",
      text: pick(lang, "I just learned my first sign on Sawiyya!", "تعلّمت أول إشارة لي على سويّة!"),
    };
    try {
      navigator.share?.(shareData).catch(() => {});
    } catch {
      /* share unsupported — ignore */
    }
  };

  // ——— Celebration takes over the full viewport (teal/gold) ———
  // Early-return: the celebration owns the whole screen (no shell chrome).
  if (step === "celebrate") {
    return (
      <div
        className="relative flex min-h-dvh w-full flex-col items-center justify-between overflow-hidden text-center text-white"
        style={{ background: "radial-gradient(circle at center, #148580 0%, #0F6E6A 70%)" }}
      >
        <Confetti burst={burst} />

        {/* scoped gentle float for the celebration hero — disabled under reduced-motion */}
        <style>{`
          @keyframes fs-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
          .fs-hero-float { animation: fs-float 4s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) { .fs-hero-float { animation: none; } }
        `}</style>

        {/* decorative arabic glyphs (md+) */}
        <span className="pointer-events-none absolute start-8 top-10 hidden select-none font-display text-9xl font-black text-white/10 md:block" aria-hidden="true">
          س
        </span>
        <span className="pointer-events-none absolute end-8 bottom-10 hidden select-none font-display text-9xl font-black text-white/10 md:block" aria-hidden="true">
          و
        </span>

        <main className="relative z-10 flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 md:max-w-2xl">
          {/* hero starburst with floating XP + streak badges */}
          <div className="fs-hero-float relative flex aspect-square w-full max-w-sm items-center justify-center md:max-w-md">
            <img
              src="brand/stitch-22.png"
              alt=""
              aria-hidden="true"
              className="animate-pop-in w-4/5 max-w-xs drop-shadow-2xl md:max-w-sm"
            />
            {/* +10 XP chip */}
            <div className="extruded-gold animate-rise absolute end-2 top-8 flex rotate-12 items-center gap-1.5 rounded-2xl bg-gold px-5 py-2 md:end-0">
              <span className="font-display text-xl font-bold text-teal-deep">+10</span>
              <span className="font-display text-[10px] font-bold tracking-tight text-teal-deep">
                {t("xp", lang)}
              </span>
            </div>
            {/* Day 1 streak badge */}
            <div className="animate-rise absolute bottom-8 start-2 flex w-24 -rotate-12 flex-col items-center justify-center gap-1 rounded-2xl border-4 border-gold bg-paper p-2 shadow-lift md:start-0">
              <Icon name="local_fire_department" fill className="text-3xl leading-none text-coral" />
              <span className="font-display text-[10px] font-extrabold uppercase tracking-widest text-teal">
                {pick(lang, "Day 1", "اليوم ١")}
              </span>
            </div>
          </div>

          {/* typography cluster — Stitch shows the Arabic glyph "وصلت!" on its own line
              above the localized celebrate string. The Arabic i18n value already leads
              with "وصلت!", so we strip that duplicate for the second line while keeping
              the localization wired. The headline line carries an explicit lang for
              correct shaping of the bilingual cluster. */}
          <h1
            className="animate-rise mt-4 font-display text-4xl font-extrabold leading-tight text-gold md:text-5xl"
            style={{ textShadow: "0 0 20px rgba(230,178,76,.6)" }}
            lang={lang}
          >
            <span dir="rtl" lang="ar">وصلت!</span>
            <br />
            <span className="text-white opacity-95">
              {t("fsCelebrate", lang).replace(/^\s*وصلت!\s*/, "")}
            </span>
          </h1>
          <p className="animate-rise mx-auto mt-4 max-w-[280px] text-lg font-medium leading-relaxed text-sand/90 md:text-xl">
            {t("fsDone", lang)}
          </p>
        </main>

        {/* footer actions — one dominant next action ("Keep going" → Learn home) */}
        <footer className="relative z-20 w-full max-w-md px-8 pb-12 pt-8">
          <div className="flex flex-col items-center gap-6">
            <Button
              full
              size="lg"
              variant="gold"
              onClick={() => go({ name: "home" })}
              className="font-display text-xl !text-teal-deep"
            >
              <span className="flex items-center justify-center gap-3">
                {t("fsKeepGoing", lang)}
                <Icon name="arrow_forward" className="text-xl font-bold leading-none rtl:rotate-180" />
              </span>
            </Button>
            <button
              type="button"
              onClick={shareMoment}
              className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-widest text-sand/60 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-teal"
            >
              {pick(lang, "Share this moment", "شارك هذه اللحظة")}
              <Icon name="ios_share" className="text-sm leading-none" />
            </button>
          </div>
        </footer>
      </div>
    );
  }

  // ——— Watch / Try chrome (single responsive tree) ———
  // Chrome-light takeover: a minimal close to home + brand only (NO tab bar).
  return (
    <ScreenShell lang={lang} chrome="takeover" onClose={() => go({ name: "home" })}>
      <main className={`mx-auto flex min-h-[calc(100dvh-57px)] w-full flex-col px-5 pb-32 pt-8 md:items-center md:justify-center md:px-6 md:text-center ${step === "try" ? "max-w-5xl" : "max-w-2xl"}`}>
        {step === "watch" ? (
          <>
            <p className="font-display text-xl font-bold text-ink/80 md:text-2xl">{t("fsIntro", lang)}</p>
            <h1 className="mt-1 font-display text-4xl font-extrabold leading-tight tracking-tight text-teal md:text-6xl">
              <span lang={lang}>{pick(lang, sign.glossEn, sign.glossAr)}</span>
              <span className="mx-2 text-muted">·</span>
              <span dir={lang === "ar" ? "ltr" : "rtl"} lang={lang === "ar" ? "en" : "ar"}>
                {pick(lang === "ar" ? "en" : "ar", sign.glossEn, sign.glossAr)}
              </span>
            </h1>
            <div className="mt-6 w-full md:mt-10 md:max-w-md">
              <SignDemo sign={sign} lang={lang} />
            </div>
            <div className="mt-8 md:mt-10">
              <StepDots step="watch" lang={lang} />
            </div>
          </>
        ) : (
          <>
            <h1 className="mb-4 text-center font-display text-2xl font-bold text-teal md:text-3xl">
              {t("fsNowYou", lang)}
            </h1>
            <CameraTrainer sign={sign} lang={lang} onResult={handleResult} autoStart />
          </>
        )}
      </main>

      {/* ONE dominant next action — coral "Now you try" (watch step only) */}
      {step === "watch" && (
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 bg-paper/80 p-5 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-md">
            <Button full size="lg" onClick={() => setStep("try")} className="font-display text-xl">
              <span className="flex items-center justify-center gap-3">
                {t("fsNowYou", lang)}
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                  <img src="brand/stitch-54.png" alt="" aria-hidden="true" className="h-7 w-7 object-contain" />
                </span>
              </span>
            </Button>
          </div>
        </div>
      )}
    </ScreenShell>
  );
}
