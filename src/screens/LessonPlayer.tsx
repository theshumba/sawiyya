// Lesson player — one drill at a time, soft feedback, end card (PRD §6.3, §8).
// Never hard-fail: misses get encouragement + the answer, and still earn XP.
import { useEffect, useMemo, useRef, useState } from "react";
import { num, pick, t } from "../i18n";
import { A1_SIGNS, ALPHABET, lessonById, signById } from "../content/signs";
import { activeProfile, useApp } from "../store/app";
import { useUi } from "../store/ui";
import type { DrillSpec, Lang, Sign } from "../types";
import { buildChoices, buildDrillQueue } from "../lesson/engine";
import { CameraTrainer, type TrainerResult } from "../components/CameraTrainer";
import { Confetti, celebrate } from "../components/Confetti";
import { SignDemo } from "../components/SignDemo";
import { Button, Card, MeetingBar, Pill } from "../components/ui";

export function LessonPlayer({ lessonId }: { lessonId: string }) {
  const app = useApp();
  const { go } = useUi();
  const profile = activeProfile(app);
  const profileId = profile?.id ?? "";

  // queue is computed once per mount — drills mutate state as they complete
  const queue = useMemo(
    () => buildDrillQueue(lessonId, useApp.getState(), profileId),
    [lessonId, profileId],
  );
  const [index, setIndex] = useState(0);
  const xpEarned = useRef(0);
  const [burst, setBurst] = useState(0);

  // nothing to do (e.g. review with no due cards) — bounce home
  const empty = queue.length === 0;
  useEffect(() => {
    if (empty) go({ name: "home" });
  }, [empty, go]);

  if (!profile || empty) return null;
  const lang = profile.language;
  const lesson = lessonById(lessonId);

  const done = index >= queue.length;
  const drill = done ? null : queue[index];

  const advance = (gainedXp: number) => {
    xpEarned.current += gainedXp;
    const next = index + 1;
    if (next >= queue.length) {
      app.recordLessonComplete();
      celebrate();
      setBurst((b) => b + 1);
    }
    setIndex(next);
  };

  if (done) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-8">
        <Confetti burst={burst} />
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="animate-pop-in flex h-28 w-28 items-center justify-center rounded-full bg-gold shadow-gold">
            <span className="text-5xl" aria-hidden="true">🎉</span>
          </div>
          <h1 className="animate-rise mt-6 text-3xl font-bold text-teal">
            {t("lsLessonDone", lang)}
          </h1>
          {lesson && (
            <p className="mt-1 text-muted">{pick(lang, lesson.titleEn, lesson.titleAr)}</p>
          )}
          <div className="mt-6 flex gap-3">
            <Pill tone="gold" className="!text-base">
              ⚡ {num(xpEarned.current, lang)} {t("lsXpEarned", lang)}
            </Pill>
            <Pill tone="coral" className="!text-base">
              🔥 {num(profile.streak, lang)} {t("homeStreak", lang)}
            </Pill>
          </div>
          <div className="mt-10 w-full">
            <Button full variant="gold" onClick={() => go({ name: "home" })}>
              {t("lsBackHome", lang)} →
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-8 pt-5">
      {/* header: close + meeting-curve progress */}
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => go({ name: "home" })}
          aria-label={t("close", lang)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal/10 text-lg"
        >
          ✕
        </button>
        <MeetingBar progress={index / queue.length} />
      </div>

      <Drill
        key={`${drill!.type}-${drill!.signId}-${index}`}
        drill={drill!}
        lang={lang}
        onDone={advance}
      />
    </div>
  );
}

// ── individual drills ───────────────────────────────────────────────────────

function Drill({
  drill,
  lang,
  onDone,
}: {
  drill: DrillSpec;
  lang: Lang;
  onDone: (xp: number) => void;
}) {
  const sign = signById(drill.signId);
  if (!sign) return null; // unreachable with valid content data
  switch (drill.type) {
    case "watch":
      return <WatchDrill sign={sign} lang={lang} onDone={onDone} />;
    case "camera":
      return <CameraDrill sign={sign} lang={lang} onDone={onDone} />;
    case "recognise":
    case "review":
      return <ChoiceDrill sign={sign} lang={lang} mode="recognise" review={drill.type === "review"} onDone={onDone} />;
    case "recall":
      return <ChoiceDrill sign={sign} lang={lang} mode="recall" onDone={onDone} />;
  }
}

function WatchDrill({ sign, lang, onDone }: { sign: Sign; lang: Lang; onDone: (xp: number) => void }) {
  const { recordDrillResult } = useApp();
  return (
    <div className="flex flex-1 flex-col">
      <h2 className="text-xl font-bold">{t("lsWatchTitle", lang)} ✨</h2>
      <div className="mt-4">
        <SignDemo sign={sign} lang={lang} />
      </div>
      <div className="mt-auto pt-5">
        <Button
          full
          onClick={() => {
            recordDrillResult(sign.id, "good", { watch: true });
            onDone(5);
          }}
        >
          {t("lsContinue", lang)}
        </Button>
      </div>
    </div>
  );
}

function CameraDrill({ sign, lang, onDone }: { sign: Sign; lang: Lang; onDone: (xp: number) => void }) {
  const { recordDrillResult } = useApp();
  const handleResult = (result: TrainerResult) => {
    if (result === "skip") {
      recordDrillResult(sign.id, "hard");
      onDone(4);
      return;
    }
    recordDrillResult(sign.id, "good", {
      camera: result === "match",
      matched: result === "match",
      selfMark: result === "selfMark",
    });
    onDone(10);
  };
  return <CameraTrainer sign={sign} lang={lang} onResult={handleResult} allowSkip autoStart />;
}

/** recognise: sign → pick meaning · recall: meaning → pick sign. */
function ChoiceDrill({
  sign,
  lang,
  mode,
  review = false,
  onDone,
}: {
  sign: Sign;
  lang: Lang;
  mode: "recognise" | "recall";
  review?: boolean;
  onDone: (xp: number) => void;
}) {
  const { recordDrillResult } = useApp();
  const pool = (sign.type === "alphabet" ? ALPHABET : A1_SIGNS).map((s) => s.id);
  const [choices] = useState(() => buildChoices(sign.id, pool));
  const [picked, setPicked] = useState<string | null>(null);
  const correct = picked === sign.id;

  const choose = (id: string) => {
    if (picked) return;
    setPicked(id);
    recordDrillResult(sign.id, id === sign.id ? "good" : "again");
  };

  return (
    <div className="flex flex-1 flex-col">
      <h2 className="text-xl font-bold">
        {review ? `${t("lsReviewTitle", lang)} ⏳` : mode === "recognise" ? t("lsRecogniseTitle", lang) : t("lsRecallTitle", lang)}
      </h2>

      {mode === "recognise" ? (
        <div className="mt-4">
          <DemoFace sign={sign} lang={lang} />
        </div>
      ) : (
        <p className="mt-4 rounded-3xl bg-teal/10 px-6 py-5 text-center text-2xl font-bold text-teal">
          {pick(lang, sign.glossEn, sign.glossAr)}
        </p>
      )}

      <div className={`mt-5 grid gap-2.5 ${mode === "recall" ? "grid-cols-2" : "grid-cols-1"}`}>
        {choices.map((id) => {
          const choice = signById(id);
          if (!choice) return null;
          const state =
            picked === null
              ? "idle"
              : id === sign.id
                ? "correct"
                : id === picked
                  ? "wrong"
                  : "dim";
          const styles = {
            idle: "border-line bg-paper",
            correct: "border-gold bg-gold/15 ring-2 ring-gold/50",
            wrong: "border-coral/50 bg-coral/10",
            dim: "border-line bg-paper opacity-50",
          }[state];
          return (
            <button
              key={id}
              type="button"
              disabled={picked !== null}
              onClick={() => choose(id)}
              className={`rounded-2xl border-2 p-4 text-start font-semibold transition ${styles}`}
            >
              {mode === "recognise" ? (
                pick(lang, choice.glossEn, choice.glossAr)
              ) : (
                <span className="flex flex-col items-center gap-1 text-center">
                  <span className="text-4xl" aria-hidden="true">
                    {choice.type === "alphabet" ? choice.code : choice.emoji}
                  </span>
                  <span className="text-xs text-muted">
                    {pick(lang, choice.hintEn, choice.hintAr).slice(0, 42)}…
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className="animate-rise mt-4">
          <p
            className={`rounded-2xl px-4 py-3 font-semibold ${correct ? "bg-gold/15 text-ink" : "bg-teal/10 text-teal"}`}
          >
            {correct ? `✓ ${t("lsCorrect", lang)}` : t("lsSoftMiss", lang)}
          </p>
          {!correct && (
            <Card className="mt-2 flex items-center gap-3 p-3">
              <span className="text-3xl" aria-hidden="true">
                {sign.type === "alphabet" ? sign.code : sign.emoji}
              </span>
              <p className="font-bold">{pick(lang, sign.glossEn, sign.glossAr)}</p>
            </Card>
          )}
        </div>
      )}

      <div className="mt-auto pt-5">
        <Button full disabled={picked === null} onClick={() => onDone(correct ? 10 : 4)}>
          {t("lsContinue", lang)}
        </Button>
      </div>
    </div>
  );
}

/** The demo face without the gloss (so recognise doesn't leak the answer). */
function DemoFace({ sign, lang }: { sign: Sign; lang: Lang }) {
  return (
    <div className="flex h-44 items-center justify-center rounded-3xl border border-line bg-gradient-to-b from-teal/10 to-gold/10">
      <span className="text-7xl" role="img" aria-label={t("lsRecogniseTitle", lang)}>
        {sign.type === "alphabet" ? (
          <span className="font-bold text-teal">{sign.code}</span>
        ) : (
          sign.emoji
        )}
      </span>
    </div>
  );
}
