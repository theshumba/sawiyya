// First-sign-in-3-min — the hook and the demo open (PRD §6.2, G1).
// First graded sign is the real-graded letter Alif (ا) — has ground-truth seeds,
// so CameraTrainer opens straight into grade mode (no teach step) and grades genuinely.
// Reskin: maps the design's 4 visual phases (intro/demo/live/done) onto the real
// 3-step machine — watch→demo (2/4), try→live (3/4), celebrate→done (4/4). The
// "intro" phase is optional chrome and is dropped; the arc starts at "watch" (M28).
//
// Redesign (§5.4): chrome-light onboarding takeover — NO global tab bar / profile button.
import { useState } from "react";
import { pick, t } from "../i18n";
import { signById } from "../content/signs";
import { activeProfile, useApp } from "../store/app";
import { useUi } from "../store/ui";
import { CameraTrainer, type TrainerResult } from "../components/CameraTrainer";
import { Confetti, celebrate } from "../components/Confetti";
import { ScreenShell } from "../components/ScreenShell";
import { NoProfileFallback } from "../components/NoProfileFallback";
import { Button, Icon } from "../components/ui";
import { SignDemo } from "../components/SignDemo";
import { Fanan } from "../components/Fanan";
import { toLocaleDigits } from "../components/dc";

type Step = "watch" | "try" | "celebrate";

// STEP labels stay wired for the accessible current-step announcement (Watch/Try/Celebrate).
const STEPS: { id: Step; icon: string; en: string; ar: string }[] = [
  { id: "watch", icon: "visibility", en: "Watch", ar: "شاهد" },
  { id: "try", icon: "front_hand", en: "Try", ar: "جرّب" },
  { id: "celebrate", icon: "emoji_events", en: "Celebrate", ar: "افرح" },
];

// Design "Block B" — top progress track (gold fill) + N/4 counter.
// The three real steps map onto phases 2..4 of the four-phase design (intro=1/4 dropped).
function ProgressHeader({ step, lang }: { step: Step; lang: "en" | "ar" }) {
  const idx = STEPS.findIndex((s) => s.id === step);
  const current = STEPS[idx];
  const num = idx + 2; // watch→2, try→3, celebrate→4
  const width = step === "watch" ? "34%" : step === "try" ? "72%" : "100%";
  return (
    <div className="flex items-center gap-2.5 pb-5">
      <span className="sr-only">{pick(lang, current.en, current.ar)}</span>
      <div
        className="h-[7px] flex-1 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={4}
        aria-valuenow={num}
      >
        <div
          className="h-full rounded-full bg-gold-mid transition-[width] duration-500 ease-out"
          style={{ width }}
        />
      </div>
      <span className="font-display text-[11px] font-bold text-muted">
        {toLocaleDigits(num, lang)}/{toLocaleDigits(4, lang)}
      </span>
    </div>
  );
}

export function FirstSign() {
  const app = useApp();
  const { go } = useUi();
  // Watch-first (M28): the promised watch-a-signer-then-try arc starts on the
  // real looping SignDemo, THEN hands over to the camera. Alif has real
  // ground-truth seeds (Tasks 2–4) so the "try" phase opens in grade mode —
  // CameraTrainer shows the ا glyph reference chip and grades genuinely.
  const [step, setStep] = useState<Step>("watch");
  const [burst, setBurst] = useState(0);
  // Track the real grading outcome so the done pill reads "live match" only on a genuine
  // camera match (never a fabricated percentage — the % lives inside CameraTrainer).
  const [result, setResult] = useState<TrainerResult | null>(null);
  const profile = activeProfile(app);
  const sign = signById("alpha-alif");
  if (!profile) return <NoProfileFallback />;
  if (!sign) return null;
  const lang = profile.language;

  const handleResult = (result: TrainerResult, meta?: { ownRecording?: boolean }) => {
    setResult(result);
    // Self-mark rates 'hard', never 'good' (H2) — the camera didn't confirm it.
    app.recordDrillResult(sign.id, result === "match" ? "good" : "hard", {
      camera: true,
      matched: result === "match",
      selfMark: result === "selfMark",
      ownRecording: meta?.ownRecording, // M2: KNN-only pass, counted apart
    });
    app.markFirstSignTime(); // time-to-first-sign metric (G1)
    celebrate();
    setBurst((b) => b + 1);
    setStep("celebrate");
  };

  // Soft fail (H2): rate 'again' so the very first card reschedules with help;
  // the trainer replays the demo in place — never a blocking fail screen.
  const handleSoftFail = () =>
    app.recordDrillResult(sign.id, "again", { camera: true, matched: false });

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

  // ——— PHASE: DONE / celebrate — full-viewport teal takeover (design §DONE) ———
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

        {/* M17: not <main> — App.tsx's screen router already owns the one
            <main> landmark. */}
        <div className="relative z-10 flex w-full max-w-md flex-1 flex-col items-center justify-center px-6">
          {/* Fanan celebrate hero (never mirrors) with floating +10 XP + Day-1 streak badges */}
          <div className="fs-hero-float relative flex items-end justify-center">
            <Fanan pose="celebrate" scale={1.2} />
            {/* XP chip — honest amount: 10 for a camera match, 4 for a self-mark */}
            <div className="extruded-gold animate-rise absolute -end-6 top-2 flex rotate-12 items-center gap-1.5 rounded-2xl bg-gold px-4 py-2">
              <span className="font-display text-xl font-bold text-teal-deep">
                +{toLocaleDigits(result === "match" ? 10 : 4, lang)}
              </span>
              <span className="font-display text-[10px] font-bold tracking-tight text-teal-deep">
                {t("xp", lang)}
              </span>
            </div>
            {/* Day 1 streak badge */}
            <div className="animate-rise absolute -bottom-4 -start-8 flex w-20 -rotate-12 flex-col items-center justify-center gap-1 rounded-2xl border-4 border-gold bg-paper p-2 shadow-lift">
              <Icon name="local_fire_department" fill className="text-2xl leading-none text-coral" />
              <span className="font-display text-[10px] font-extrabold uppercase tracking-widest text-teal">
                {pick(lang, "Day 1", "اليوم ١")}
              </span>
            </div>
          </div>

          {/* success checkmark badge (never mirrors) */}
          <div className="animate-pop mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-success shadow-[0_6px_18px_rgba(31,138,91,.35)]">
            <span className="font-display text-3xl font-extrabold text-paper">✓</span>
          </div>

          {/* typography cluster — the Arabic i18n value leads with "وصلت!", so we render that
              glyph on its own line then strip the duplicate from the localized string below. */}
          <h1
            className="animate-rise mt-4 font-display text-3xl font-extrabold leading-tight text-gold md:text-4xl"
            style={{ textShadow: "0 0 20px rgba(230,178,76,.6)" }}
            lang={lang}
          >
            <span dir="rtl" lang="ar">وصلت!</span>
            <br />
            <span className="text-white opacity-95">
              {t("fsCelebrate", lang).replace(/^\s*وصلت!\s*/, "")}
            </span>
          </h1>

          {/* accuracy pill — real, camera-graded outcome only (no fabricated %) */}
          {result === "match" && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2">
              <Icon name="check_circle" fill className="text-lg leading-none text-success" />
              <span className="font-display text-[15px] font-bold text-teal">
                {t("fsDoneBadgeMatch", lang)}
              </span>
            </div>
          )}

          <p className="animate-rise mx-auto mt-4 max-w-[280px] text-lg font-medium leading-relaxed text-sand/90">
            {t("fsDone", lang)}
          </p>
        </div>

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

  // ——— PHASES: DEMO (watch) + LIVE (try) — chrome-light takeover ———
  return (
    <ScreenShell lang={lang} chrome="takeover" onClose={() => go({ name: "home" })}>
      {/* M17: not <main> — App.tsx's screen router already owns the one
          <main> landmark. */}
      <div
        className={`mx-auto flex min-h-[calc(100dvh-57px)] w-full flex-col px-5 pb-32 pt-6 md:px-6 ${
          step === "try" ? "max-w-3xl" : "max-w-2xl"
        }`}
      >
        <ProgressHeader step={step} lang={lang} />

        {step === "watch" ? (
          // PHASE: DEMO / "watch" (2/4) — real looping SignDemo clip.
          <div className="flex flex-1 flex-col md:items-center md:text-center">
            <p className="font-display text-sm font-semibold text-muted">{t("fsIntro", lang)}</p>
            <h1 className="mt-1 font-display text-[22px] font-extrabold leading-tight text-ink md:text-3xl">
              {t("fsDemoTitle", lang)}
            </h1>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">{t("fsDemoSub", lang)}</p>

            <div className="mt-5 w-full md:mt-6 md:max-w-md">
              <SignDemo sign={sign} lang={lang} />
            </div>

            {/* dynamic caption — the real sign's gloss (NOT the design's "I love you") */}
            <p className="mt-4 text-center font-display text-[15px] font-semibold text-ink">
              {t("fsDemoMeans", lang).replace("{gloss}", pick(lang, sign.glossEn, sign.glossAr))}
            </p>
          </div>
        ) : (
          // PHASE: LIVE / "try" (3/4) — the real on-device grader (CameraTrainer draws
          // the LIVE badge, skeleton, confidence ring + on-device badge itself).
          <div className="flex flex-1 flex-col md:items-center md:text-center">
            <h1 className="font-display text-[21px] font-extrabold leading-tight text-ink md:text-3xl">
              {t("fsLiveTitle", lang)}
            </h1>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">{t("fsLiveSub", lang)}</p>
            <div className="mt-4 w-full flex-1 md:max-w-xl">
              <CameraTrainer sign={sign} lang={lang} onResult={handleResult} onSoftFail={handleSoftFail} autoStart />
            </div>
          </div>
        )}
      </div>

      {/* ONE dominant next action — coral springy "Now you try" (watch/demo step only) */}
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
