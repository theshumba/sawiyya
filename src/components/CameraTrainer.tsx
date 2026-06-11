// CameraTrainer — the core grading loop (PRD §6.4, §9).
// Live landmarks → normalise → KNN → confidence → match / "not sure".
// Never hard-fails: self-mark is always one tap away (§9.5).
// Teach mode (§9.2): record samples of a handshape → KNN learns it live.
import { useEffect, useRef, useState } from "react";
import { pick, t } from "../i18n";
import type { Lang, Sign } from "../types";
import { normalizeLandmarks } from "../recognizer/normalize";
import { addSample, classify, clearClass, isTrained, sampleCount, TAU } from "../recognizer/knn";
import { useHandTracker, type FrameInfo } from "../recognizer/useHandTracker";
import { Button } from "./ui";

export type TrainerResult = "match" | "selfMark" | "skip";

const HOLD_FRAMES = 10; // consecutive matching frames to confirm (~0.5 s @20fps)
const TEACH_TARGET = 24; // samples recorded in teach mode
const UNSURE_AFTER_FRAMES = 140; // ~7 s of trying → show encouragement band

export function CameraTrainer({
  sign,
  lang,
  onResult,
  allowSkip = false,
  autoStart = false,
}: {
  sign: Sign;
  lang: Lang;
  onResult: (result: TrainerResult) => void;
  allowSkip?: boolean;
  autoStart?: boolean;
}) {
  const [mode, setMode] = useState<"grade" | "teach">(isTrained(sign.id) ? "grade" : "teach");
  const [teachPhase, setTeachPhase] = useState<"intro" | "capturing" | "done">("intro");
  const [captured, setCaptured] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const [matched, setMatched] = useState(false);
  const [showUnsure, setShowUnsure] = useState(false);

  const consecutive = useRef(0);
  const attemptFrames = useRef(0);
  const frameSkip = useRef(0);
  const finished = useRef(false);
  const teaching = useRef(false);

  // refs so the per-frame callback never goes stale
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const onFrame = (frame: FrameInfo | null) => {
    if (finished.current) return;
    if (!frame) {
      setConfidence(0);
      setHoldProgress(0);
      consecutive.current = 0;
      return;
    }
    const mirror = frame.detectedHand === "Left"; // canonicalise both hands (§6.8)
    const vec = normalizeLandmarks(frame.landmarks, mirror);

    if (modeRef.current === "teach") {
      if (!teaching.current) return;
      frameSkip.current = (frameSkip.current + 1) % 3;
      if (frameSkip.current !== 0) return; // sample every 3rd frame for variety
      addSample(sign.id, vec);
      const n = sampleCount(sign.id);
      setCaptured(n);
      if (n >= TEACH_TARGET) {
        teaching.current = false;
        setTeachPhase("done");
      }
      return;
    }

    // grade mode
    attemptFrames.current += 1;
    if (attemptFrames.current > UNSURE_AFTER_FRAMES) setShowUnsure(true);
    const result = classify(vec);
    const isTarget = result.classId === sign.id && result.confidence >= TAU;
    setConfidence(result.classId === sign.id ? result.confidence : 0);
    consecutive.current = isTarget ? consecutive.current + 1 : 0;
    setHoldProgress(Math.min(1, consecutive.current / HOLD_FRAMES));
    if (consecutive.current >= HOLD_FRAMES) {
      finished.current = true;
      setMatched(true);
      setTimeout(() => onResult("match"), 900);
    }
  };

  const tracker = useHandTracker(onFrame);

  // auto-start camera when asked (lesson flow) — browsers allow this after a tap navigation
  useEffect(() => {
    if (autoStart) void tracker.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const startTeach = () => {
    clearClass(sign.id);
    setCaptured(0);
    setTeachPhase("capturing");
    teaching.current = true;
    if (tracker.status !== "running") void tracker.start();
  };

  const finishResult = (r: TrainerResult) => {
    if (finished.current) return;
    finished.current = true;
    tracker.stop();
    onResult(r);
  };

  const gloss = pick(lang, sign.glossEn, sign.glossAr);
  const target = sign.type === "alphabet" ? sign.code : gloss;

  return (
    <div className="flex flex-col gap-4">
      {/* target prompt */}
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold">
          {t("camSign", lang)}{" "}
          <span className="rounded-xl bg-teal/10 px-3 py-1 text-2xl text-teal">{target}</span>
        </p>
        {mode === "grade" && isTrained(sign.id) && (
          <button
            type="button"
            onClick={() => {
              setMode("teach");
              setTeachPhase("intro");
            }}
            className="text-sm font-semibold text-muted underline"
          >
            {t("camResetClass", lang)}
          </button>
        )}
      </div>

      {/* camera stage */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-bowl bg-ink shadow-lift">
        <video
          ref={tracker.videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
        />
        <canvas
          ref={tracker.canvasRef}
          className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
        />

        {/* status pills */}
        <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between" dir="ltr">
          <span className="flex items-center gap-2 rounded-full bg-teal-ink/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
            <span
              className={`h-2 w-2 rounded-full ${tracker.handVisible ? "bg-gold shadow-gold" : "bg-white/40"}`}
            />
            {tracker.status === "loading"
              ? t("camLoading", lang)
              : tracker.handVisible
                ? t("camHandSeen", lang)
                : t("camLooking", lang)}
          </span>
          {tracker.status === "running" && (
            <span className="rounded-full bg-teal-ink/60 px-3 py-1.5 font-display text-xs font-semibold text-white backdrop-blur">
              {tracker.fps} fps
            </span>
          )}
        </div>

        {/* idle → start */}
        {tracker.status === "idle" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <span className="text-5xl" aria-hidden="true">📷</span>
            <Button variant="gold" onClick={() => void tracker.start()}>
              {t("camStart", lang)}
            </Button>
            <p className="text-xs text-white/70">{t("camPrivacy", lang)}</p>
          </div>
        )}
        {tracker.status === "error" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="font-semibold text-white">{t("camBlocked", lang)}</p>
            <p className="text-xs text-white/60">{tracker.error}</p>
            <Button variant="gold" onClick={() => void tracker.start()}>
              {t("camTryAgain", lang)}
            </Button>
          </div>
        )}

        {/* teach overlay */}
        {mode === "teach" && tracker.status !== "idle" && tracker.status !== "error" && (
          <div className="absolute inset-x-3 bottom-3 z-10 rounded-2xl bg-teal-deep/75 p-4 text-white backdrop-blur">
            {teachPhase === "intro" && (
              <>
                <p className="font-bold">{t("camTeach", lang)} 🎓</p>
                <p className="mt-1 text-sm text-white/85">{t("camTeachSub", lang)}</p>
                <Button variant="gold" className="mt-3 w-full !py-3" onClick={startTeach}>
                  {t("camStart", lang)}
                </Button>
              </>
            )}
            {teachPhase === "capturing" && (
              <>
                <p className="font-bold">{t("camTeachHold", lang)}</p>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-gold transition-all"
                    style={{ width: `${(captured / TEACH_TARGET) * 100}%` }}
                  />
                </div>
                <p className="mt-1.5 font-display text-sm">
                  {captured} / {TEACH_TARGET} {t("camSamples", lang)}
                </p>
              </>
            )}
            {teachPhase === "done" && (
              <>
                <p className="font-bold text-gold">✓ {t("camTeachDone", lang)}</p>
                <Button
                  variant="gold"
                  className="mt-3 w-full !py-3"
                  onClick={() => {
                    consecutive.current = 0;
                    attemptFrames.current = 0;
                    setShowUnsure(false);
                    setMode("grade");
                  }}
                >
                  {t("fsNowYou", lang)}
                </Button>
              </>
            )}
          </div>
        )}

        {/* grade overlay: hold-progress + confidence */}
        {mode === "grade" && tracker.status === "running" && !matched && (
          <div className="absolute inset-x-3 bottom-3 z-10 rounded-2xl bg-teal-ink/60 p-3.5 text-white backdrop-blur">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>{holdProgress > 0 ? t("camHold", lang) : t("camConfidence", lang)}</span>
              <span className="font-display">{Math.round(confidence * 100)}%</span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/20">
              <div
                className={`h-full rounded-full transition-all ${holdProgress > 0 ? "bg-gold" : "bg-coral"}`}
                style={{ width: `${(holdProgress > 0 ? holdProgress : confidence) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* matched! */}
        {matched && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-teal-deep/70 backdrop-blur-sm">
            <span className="animate-pop-in text-7xl" aria-hidden="true">✓</span>
            <p className="animate-rise mt-2 text-2xl font-bold text-gold">{t("camMatch", lang)}</p>
          </div>
        )}
      </div>

      {/* never-hard-fail controls (§6.4 — self-mark ALWAYS available,
          including teach mode and blocked/absent cameras) */}
      {!matched && (
        <div className="flex flex-col gap-2">
          {showUnsure && (
            <p className="rounded-2xl bg-gold/15 px-4 py-3 text-sm font-medium text-ink">
              {t("camUnsure", lang)}
            </p>
          )}
          <Button variant="secondary" full onClick={() => finishResult("selfMark")}>
            ✓ {t("camSelfMark", lang)}
            <span className="block text-xs font-normal opacity-80">{t("camSelfMarkSub", lang)}</span>
          </Button>
          {allowSkip && (
            <Button variant="ghost" full onClick={() => finishResult("skip")}>
              {t("camSkip", lang)}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
