// Standalone camera practice — "Practise the alphabet" (PRD §7, §8).
// Pick a letter or gradable sign → teach the camera once → live grading.
// Visuals mirror design/stitch-v2-brand practise-the-alphabet--mobile.
import { useState } from "react";
import { num, pick, t, type TKey } from "../i18n";
import { ALPHABET, A1_SIGNS, signById } from "../content/signs";
import { activeProfile, useApp, xpTodayFor } from "../store/app";
import { useUi } from "../store/ui";
import { isTrained } from "../recognizer/knn";
import { CameraTrainer } from "../components/CameraTrainer";
import { Confetti, celebrate } from "../components/Confetti";
import { Icon, Logo, Pill } from "../components/ui";
import type { Lang } from "../types";
import type { Screen } from "../store/ui";

const GRADABLE_SIGNS = A1_SIGNS.filter((s) => s.cameraGradable);

// Desktop-only left vertical nav rail (camera-drill-i-love-you--desktop).
// Mobile uses the app-shell BottomNav; this rail only appears at md+.
const RAIL_TABS: { name: Screen["name"]; icon: string; key: TKey }[] = [
  { name: "home", icon: "home", key: "navHome" },
  { name: "camera", icon: "videocam", key: "navCamera" },
  { name: "family", icon: "favorite", key: "navFamily" },
  { name: "progress", icon: "leaderboard", key: "navProgress" },
];

function SideNavBar({
  lang,
  active,
  go,
}: {
  lang: Lang;
  active: Screen["name"];
  go: (s: Screen) => void;
}) {
  return (
    <aside className="sticky top-0 hidden h-screen w-24 shrink-0 flex-col items-center gap-8 border-e-4 border-teal/10 bg-sand py-8 md:flex">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal shadow-lift">
        <Logo size={28} />
      </div>
      <nav className="flex flex-col gap-6" aria-label="Main">
        {RAIL_TABS.map((tab) => {
          const isActive = tab.name === active;
          return (
            <button
              key={tab.name}
              type="button"
              onClick={() => go({ name: tab.name } as Screen)}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-xl p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
                isActive
                  ? "translate-y-1 bg-teal text-white shadow-[0_4px_0_0_#0A4F4C]"
                  : "text-teal/60 hover:bg-teal/5 hover:text-teal"
              }`}
            >
              <Icon name={tab.icon} fill={isActive} className="text-2xl leading-none" />
              <span className="mt-1 block font-display text-[10px] font-bold uppercase tracking-wider">
                {t(tab.key, lang)}
              </span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

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
    <div className="md:flex md:items-start">
      <SideNavBar lang={lang} active="camera" go={go} />
      <div className="mx-auto max-w-md px-5 pb-28 pt-6 md:max-w-5xl md:flex-1 md:px-8 md:pb-12 md:pt-10">
        <Confetti burst={burst} />
      <header className="mb-4 flex items-center justify-between gap-3 md:mb-6">
        <h1 className="font-display text-2xl font-bold md:text-4xl">{t("camPractice", lang)}</h1>
        <div className="flex shrink-0 items-center gap-2">
          <Pill tone="gold" className="!py-1">
            <Icon name="stars" fill className="text-base leading-none text-gold" />
            <span className="font-display">
              {num(xpTodayFor(profile), lang)} {t("xp", lang)}
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
    </div>
  );
}
