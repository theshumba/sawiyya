// Onboarding — "pick your why" (PRD §6.1).
// Splash → language → who for → handedness → goal → name → first-sign flow.
// Skippable to defaults (Parent / right / Regular); target < 45 s.
import { useState } from "react";
import { pick, t, applyDir } from "../i18n";
import { PERSONA_TAGLINE } from "../content/signs";
import { useApp } from "../store/app";
import { useUi } from "../store/ui";
import type { DailyGoal, Hand, Lang, Persona } from "../types";
import { Button, Card, Logo, Wordmark } from "../components/ui";

type Step = "splash" | "lang" | "why" | "hand" | "goal" | "name";

const PERSONAS: { value: Persona; emoji: string; key: "obParent" | "obSibling" | "obTeacher" | "obFriend" | "obDeaf"; subKey: "obParentSub" | "obSiblingSub" | "obTeacherSub" | "obFriendSub" | "obDeafSub" }[] = [
  { value: "parent", emoji: "👶", key: "obParent", subKey: "obParentSub" },
  { value: "sibling", emoji: "🧒", key: "obSibling", subKey: "obSiblingSub" },
  { value: "teacher", emoji: "🏫", key: "obTeacher", subKey: "obTeacherSub" },
  { value: "friend", emoji: "🤝", key: "obFriend", subKey: "obFriendSub" },
  { value: "deaf", emoji: "🧏", key: "obDeaf", subKey: "obDeafSub" },
];

const GOALS: { value: DailyGoal; key: "obCasual" | "obRegular" | "obSerious"; emoji: string }[] = [
  { value: "casual", key: "obCasual", emoji: "🌱" },
  { value: "regular", key: "obRegular", emoji: "🌿" },
  { value: "serious", key: "obSerious", emoji: "🌳" },
];

export function Onboarding() {
  const { createProfile, completeOnboarding } = useApp();
  const { go } = useUi();
  const [step, setStep] = useState<Step>("splash");
  const [lang, setLang] = useState<Lang>("en");
  const [persona, setPersona] = useState<Persona>("parent");
  const [hand, setHand] = useState<Hand>("R");
  const [goal, setGoal] = useState<DailyGoal>("regular");
  const [name, setName] = useState("");

  const finish = (overrides?: { skipAll?: boolean }) => {
    const displayName =
      name.trim() ||
      (lang === "ar" ? "أنا" : "Me");
    createProfile({
      displayName,
      role: overrides?.skipAll ? "parent" : persona,
      dominantHand: overrides?.skipAll ? "R" : hand,
      language: lang,
      dailyGoal: overrides?.skipAll ? "regular" : goal,
    });
    completeOnboarding();
    go({ name: "firstSign" });
  };

  const chooseLang = (l: Lang) => {
    setLang(l);
    applyDir(l);
    setStep("why");
  };

  const stepIndex = ["splash", "lang", "why", "hand", "goal", "name"].indexOf(step);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-8">
      {/* progress dots */}
      {step !== "splash" && (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-1.5" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i <= stepIndex ? "w-6 bg-teal" : "w-3 bg-teal/20"}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => finish({ skipAll: true })}
            className="text-sm font-semibold text-muted"
          >
            {t("obSkip", lang)}
          </button>
        </div>
      )}

      {step === "splash" && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="animate-pop-in">
            <Logo size={110} />
          </div>
          <Wordmark className="mt-4 animate-rise text-4xl" />
          <p className="mt-1 text-2xl font-semibold text-teal" dir="rtl">سويّة</p>
          <p className="mt-4 max-w-xs animate-rise text-muted">{t("tagline", "en")}</p>
          <div className="mt-10 w-full">
            <Button full onClick={() => setStep("lang")}>
              {t("obStart", "en")} · لنبدأ
            </Button>
          </div>
        </div>
      )}

      {step === "lang" && (
        <div className="flex flex-1 flex-col justify-center gap-4">
          <h1 className="mb-2 text-center text-2xl font-bold">{t("obChooseLang", lang)}</h1>
          <Card className="p-5 text-center text-xl font-bold" onClick={() => chooseLang("ar")}>
            <span dir="rtl">العربية</span>
            <p className="mt-1 text-sm font-medium text-muted">Arabic — RTL native</p>
          </Card>
          <Card className="p-5 text-center text-xl font-bold" onClick={() => chooseLang("en")}>
            English
            <p className="mt-1 text-sm font-medium text-muted">الإنجليزية</p>
          </Card>
        </div>
      )}

      {step === "why" && (
        <div className="flex flex-1 flex-col">
          <h1 className="text-2xl font-bold">{t("obWhoTitle", lang)}</h1>
          <p className="mt-1 text-muted">{t("obWhoSub", lang)}</p>
          <div className="mt-5 flex flex-col gap-2.5">
            {PERSONAS.map((p) => (
              <Card
                key={p.value}
                className={`flex items-center gap-3.5 p-4 ${persona === p.value ? "!border-teal ring-2 ring-teal/30" : ""}`}
                onClick={() => {
                  setPersona(p.value);
                  setStep("hand");
                }}
              >
                <span className="text-3xl" aria-hidden="true">{p.emoji}</span>
                <div>
                  <p className="font-bold">{t(p.key, lang)}</p>
                  <p className="text-sm text-muted">{t(p.subKey, lang)}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {step === "hand" && (
        <div className="flex flex-1 flex-col">
          <h1 className="text-2xl font-bold">{t("obHandTitle", lang)}</h1>
          <p className="mt-1 text-muted">{t("obHandSub", lang)}</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {(
              [
                { value: "R" as Hand, key: "obRight" as const, emoji: "🤚" },
                { value: "L" as Hand, key: "obLeft" as const, emoji: "✋" },
              ]
            ).map((h) => (
              <Card
                key={h.value}
                className="flex flex-col items-center gap-2 p-6"
                onClick={() => {
                  setHand(h.value);
                  setStep("goal");
                }}
              >
                <span className="text-5xl" aria-hidden="true">{h.emoji}</span>
                <p className="font-bold">{t(h.key, lang)}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {step === "goal" && (
        <div className="flex flex-1 flex-col">
          <h1 className="text-2xl font-bold">{t("obGoalTitle", lang)}</h1>
          <p className="mt-1 text-muted">{t("obGoalSub", lang)}</p>
          <div className="mt-6 flex flex-col gap-2.5">
            {GOALS.map((g) => (
              <Card
                key={g.value}
                className="flex items-center gap-3.5 p-4"
                onClick={() => {
                  setGoal(g.value);
                  setStep("name");
                }}
              >
                <span className="text-3xl" aria-hidden="true">{g.emoji}</span>
                <p className="font-bold">{t(g.key, lang)}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {step === "name" && (
        <div className="flex flex-1 flex-col">
          <h1 className="text-2xl font-bold">{t("obNameTitle", lang)}</h1>
          <p className="mt-1 text-muted">{PERSONA_TAGLINE[persona] ? pick(lang, PERSONA_TAGLINE[persona].en, PERSONA_TAGLINE[persona].ar) : ""}</p>
          <form
            className="mt-6 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              finish();
            }}
          >
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={lang === "ar" ? "اسمك" : "Your name"}
              maxLength={20}
              className="rounded-2xl border-2 border-line bg-paper px-5 py-4 text-lg font-semibold placeholder:text-muted/60 focus:border-teal"
            />
            <Button full type="submit">
              {t("obContinue", lang)}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
