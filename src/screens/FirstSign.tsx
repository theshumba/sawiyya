// First-sign-in-3-min — the hook and the demo open (PRD §6.2, G1).
// Learn ONE sign ("I love you / أحبك") → film it → gold celebration.
// Visuals mirror first-sign-watch-i-love-you / -demo + celebration-connection-made (stitch-v2-brand).
import { useState } from "react";
import { pick, t } from "../i18n";
import { signById } from "../content/signs";
import { activeProfile, useApp } from "../store/app";
import { useUi } from "../store/ui";
import { CameraTrainer, type TrainerResult } from "../components/CameraTrainer";
import { Confetti, celebrate } from "../components/Confetti";
import { SignDemo } from "../components/SignDemo";
import { Button, Icon, Logo, Wordmark } from "../components/ui";

type Step = "watch" | "try" | "celebrate";

// `winLabel` differs by composition: the mobile Stitch uses "WIN", the desktop
// shell uses the longer "CELEBRATE" wording. We pass the right copy per layout.
const STEPS: { id: Step; icon: string; en: string; ar: string; winEn?: string }[] = [
  { id: "watch", icon: "visibility", en: "Watch", ar: "شاهد" },
  { id: "try", icon: "front_hand", en: "Try", ar: "جرّب" },
  { id: "celebrate", icon: "emoji_events", en: "Win", ar: "افرح", winEn: "Celebrate" },
];

function StepDots({ step, lang, desktop = false }: { step: Step; lang: "en" | "ar"; desktop?: boolean }) {
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
                {pick(lang, desktop && s.winEn ? s.winEn : s.en, s.ar)}
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

  // ——— Celebration takes over the full viewport (teal/gold) ———
  if (step === "celebrate") {
    return (
      <div
        className="relative flex min-h-screen w-full flex-col items-center justify-between overflow-hidden text-center text-white"
        style={{ background: "radial-gradient(circle at center, #148580 0%, #0F6E6A 70%)" }}
      >
        <Confetti burst={burst} />

        {/* scoped gentle float for the celebration hero — disabled under reduced-motion */}
        <style>{`
          @keyframes fs-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
          .fs-hero-float { animation: fs-float 4s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) { .fs-hero-float { animation: none; } }
        `}</style>

        {/* decorative arabic glyphs — appear once the desktop composition kicks in (md+) */}
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
              above the localized celebrate string (both langs). The Arabic i18n value
              already leads with "وصلت!", so we strip that duplicate for the second line
              while keeping the localization wired (no hardcoded English). */}
          <h1
            className="animate-rise mt-4 font-display text-4xl font-extrabold leading-tight text-gold md:text-5xl"
            style={{ textShadow: "0 0 20px rgba(230,178,76,.6)" }}
          >
            <span dir="rtl">وصلت!</span>
            <br />
            <span className="text-white opacity-95">
              {t("fsCelebrate", lang).replace(/^\s*وصلت!\s*/, "")}
            </span>
          </h1>
          <p className="animate-rise mx-auto mt-4 max-w-[280px] text-lg font-medium leading-relaxed text-sand/90 md:text-xl">
            {t("fsDone", lang)}
          </p>
        </main>

        {/* footer actions */}
        <footer className="relative z-20 w-full max-w-md px-8 pb-12 pt-8">
          <div className="flex flex-col items-center gap-6">
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
            <button
              type="button"
              onClick={() => go({ name: "home" })}
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

  // ——— Watch / Try chrome ———
  // Mobile keeps the task-focused teal top bar (close · wordmark · settings).
  // Desktop (md+) renders the full Stitch app shell: top nav + left sidebar.

  // The "Now you try" CTA — coral, with the ILY hand chip the Stitch button carries.
  const nowYouCta = (
    <Button full onClick={() => setStep("try")} className="!rounded-2xl !py-5 font-display text-xl">
      <span className="flex items-center justify-center gap-3">
        {t("fsNowYou", lang)}
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
          <img src="brand/stitch-54.png" alt="" aria-hidden="true" className="h-7 w-7 object-contain" />
        </span>
      </span>
    </Button>
  );

  // Shared "watch" body (heading · demo card · step dots). `desktop` centres + scales
  // the type and uses the longer "CELEBRATE" step label per the desktop Stitch.
  const watchBody = (desktop: boolean) => (
    <>
      <p className="font-display text-xl font-bold text-ink/80 md:text-2xl">{t("fsIntro", lang)}</p>
      <h1 className="mt-1 font-display text-4xl font-extrabold leading-tight tracking-tight text-teal md:text-6xl">
        {pick(lang, sign.glossEn, sign.glossAr)}
        <span className="mx-2 text-muted">·</span>
        <span dir={lang === "ar" ? "ltr" : "rtl"}>
          {pick(lang === "ar" ? "en" : "ar", sign.glossEn, sign.glossAr)}
        </span>
      </h1>
      <div className="mt-6 w-full md:mt-10 md:max-w-md">
        <SignDemo sign={sign} lang={lang} />
      </div>
      <div className="mt-8 md:mt-10">
        <StepDots step="watch" lang={lang} desktop={desktop} />
      </div>
    </>
  );

  const tryBody = (
    <>
      <h1 className="mb-4 text-center font-display text-2xl font-bold text-teal md:text-3xl">
        {t("fsNowYou", lang)}
      </h1>
      <CameraTrainer sign={sign} lang={lang} onResult={handleResult} autoStart />
    </>
  );

  // Left sidebar nav item (desktop shell).
  const sideItem = (icon: string, label: string, target: Parameters<typeof go>[0], activeNav = false) => (
    <button
      type="button"
      onClick={() => go(target)}
      className={`flex items-center gap-4 rounded-xl p-4 text-start transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
        activeNav ? "extruded-teal bg-teal text-white" : "text-teal hover:bg-teal/5"
      }`}
    >
      <Icon name={icon} fill={activeNav} className="text-2xl leading-none" />
      <span className="font-display text-lg font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen w-full bg-sand">
      {/* ===== MOBILE chrome (task-focused teal top bar) ===== */}
      <div className="flex min-h-screen w-full flex-col md:hidden">
        <header className="flex w-full items-center justify-between bg-teal px-5 py-4 text-paper">
          <button
            type="button"
            onClick={() => go({ name: "home" })}
            aria-label={pick(lang, "Close", "إغلاق")}
            className="transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-teal"
          >
            <Icon name="close" className="text-2xl leading-none" />
          </button>
          <Wordmark className="font-display text-2xl" />
          <button
            type="button"
            onClick={() => go({ name: "settings" })}
            aria-label={pick(lang, "Settings", "الإعدادات")}
            className="transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-teal"
          >
            <Icon name="settings" className="text-2xl leading-none" />
          </button>
        </header>

        {step === "watch" ? (
          <>
            <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-32 pt-8">{watchBody(false)}</main>
            <div className="fixed inset-x-0 bottom-0 z-30 bg-paper/80 p-5 backdrop-blur-sm">
              <div className="mx-auto w-full max-w-md">{nowYouCta}</div>
            </div>
          </>
        ) : (
          <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-10 pt-8">{tryBody}</main>
        )}
      </div>

      {/* ===== DESKTOP app shell (top nav + left sidebar) ===== */}
      <div className="hidden min-h-screen w-full flex-col md:flex">
        {/* top nav: brand · Learn/Practice/Family · streak/XP/avatar */}
        <header className="sticky top-0 z-50 flex h-20 w-full items-center justify-between border-b-4 border-teal-deep bg-teal px-8 text-paper shadow-md">
          <button
            type="button"
            onClick={() => go({ name: "home" })}
            className="flex items-center gap-4 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-teal"
            aria-label={pick(lang, "Home", "الرئيسية")}
          >
            <span className="flex items-center justify-center rounded-xl bg-paper p-1.5">
              <Logo size={28} />
            </span>
            <Wordmark className="font-display text-2xl" />
          </button>
          <nav className="flex items-center gap-8">
            <span className="font-display font-bold text-gold">{pick(lang, "Learn", "تعلّم")}</span>
            <button
              type="button"
              onClick={() => go({ name: "camera" })}
              className="rounded-lg px-3 py-1 font-display text-sand/80 transition hover:bg-teal-deep/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {pick(lang, "Practice", "تدرّب")}
            </button>
            <button
              type="button"
              onClick={() => go({ name: "family" })}
              className="rounded-lg px-3 py-1 font-display text-sand/80 transition hover:bg-teal-deep/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {pick(lang, "Family", "العائلة")}
            </button>
          </nav>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2" aria-label={pick(lang, "Streak", "المواظبة")}>
              <Icon name="local_fire_department" fill className="text-xl leading-none text-gold" />
              <span className="font-display text-xl font-bold">{profile.streak}</span>
            </span>
            <span className="flex items-center gap-2" aria-label={t("xp", lang)}>
              <Icon name="stars" fill className="text-xl leading-none text-gold" />
              <span className="font-display text-xl font-bold">{profile.xp}</span>
            </span>
            <span
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-gold bg-paper text-xl leading-none"
              aria-label={profile.displayName}
            >
              {profile.emoji}
            </span>
          </div>
        </header>

        <div className="flex w-full flex-1">
          {/* left sidebar: Home/Camera/Family/Progress + Start Practice card */}
          <aside className="hidden w-72 flex-col border-e-4 border-teal/10 bg-sand p-6 lg:flex">
            <div className="mb-8">
              <h3 className="font-display text-3xl font-bold text-teal">
                <Wordmark />
              </h3>
              <p className="font-sans text-sm text-teal/60">{pick(lang, "Learning Together", "نتعلّم معًا")}</p>
            </div>
            <nav className="flex flex-col gap-3">
              {sideItem("home", pick(lang, "Home", "الرئيسية"), { name: "home" }, true)}
              {sideItem("videocam", pick(lang, "Camera", "الكاميرا"), { name: "camera" })}
              {sideItem("favorite", pick(lang, "Family", "العائلة"), { name: "family" })}
              {sideItem("leaderboard", pick(lang, "Progress", "التقدّم"), { name: "progress" })}
            </nav>
            <div className="mt-auto rounded-3xl border-2 border-gold/20 bg-gold/10 p-6">
              <p className="mb-4 text-center font-display font-bold text-ink">
                {pick(lang, "You're on fire!", "أنت متألق!")}
              </p>
              <Button full variant="secondary" onClick={() => setStep("try")} className="!rounded-xl !py-3 text-base">
                {pick(lang, "Start Practice", "ابدأ التدريب")}
              </Button>
            </div>
          </aside>

          {/* main learning stage */}
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
            {step === "watch" ? (
              <>
                <main className="flex w-full max-w-2xl flex-col items-center text-center">{watchBody(true)}</main>
                <div className="mt-12 w-full max-w-sm">{nowYouCta}</div>
              </>
            ) : (
              <main className="flex w-full max-w-2xl flex-col">{tryBody}</main>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
