// CameraTrainer — the core grading loop (PRD §6.4, §9).
// Live landmarks → normalise → KNN → confidence → match / "not sure".
// Never hard-fails: self-mark is always one tap away (§9.5).
// Teach mode (§9.2): record samples of a handshape → KNN learns it live.
// Visuals mirror design/stitch-v2-brand lesson-camera-practice + practise-the-alphabet.
import { useEffect, useRef, useState } from "react";
import { pick, t } from "../i18n";
import type { Lang, Sign } from "../types";
import { normalizeLandmarks } from "../recognizer/normalize";
import { addSample, classifyAgainst, clearClass, isTrained, sampleCount } from "../recognizer/knn";
import { useHandTracker, type FrameInfo } from "../recognizer/useHandTracker";
import { Button, Icon } from "./ui";

export type TrainerResult = "match" | "selfMark" | "skip";

const HOLD_FRAMES = 10; // consecutive matching frames to confirm (~0.5 s @20fps)
const TEACH_TARGET = 24; // samples recorded in teach mode
const UNSURE_AFTER_FRAMES = 140; // ~7 s of trying → show encouragement band

const HOLD_RING_C = 2 * Math.PI * 36; // hold-to-confirm ring circumference

export function CameraTrainer({
  sign,
  lang,
  onResult,
  allowSkip = false,
  autoStart = false,
  exerciseLabel,
}: {
  sign: Sign;
  lang: Lang;
  onResult: (result: TrainerResult) => void;
  allowSkip?: boolean;
  autoStart?: boolean;
  /** Optional "EXERCISE 4 OF 12" progress label shown inside the prompt card
   *  (lesson-camera-practice--mobile / camera-drill-i-love-you--desktop). */
  exerciseLabel?: string;
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
    // Grade against THIS sign's class specifically — never the global argmax,
    // which sticks the meter at 0% once another class is trained (knn.ts).
    const result = classifyAgainst(vec, sign.id);
    setConfidence(result.confidence);
    consecutive.current = result.matched ? consecutive.current + 1 : 0;
    setHoldProgress(Math.min(1, consecutive.current / HOLD_FRAMES));
    if (consecutive.current >= HOLD_FRAMES) {
      finished.current = true;
      tracker.stop(); // release the camera the moment the match confirms
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
  const meter = holdProgress > 0 ? holdProgress : confidence;

  // Reference chip content — reused in both layouts.
  const referenceChip = (sizeClass: string) =>
    sign.id === "iloveyou" ? (
      <img src="brand/stitch-34.png" alt={gloss} className="h-full w-full rounded-xl object-cover" />
    ) : sign.type === "alphabet" ? (
      <span className={`font-display font-bold text-white ${sizeClass}`} aria-label={gloss}>
        {sign.code}
      </span>
    ) : (
      <Icon name="sign_language" className={`leading-none text-white ${sizeClass}`} />
    );

  // The prompt banner (teal card) — full width on mobile, panel header on desktop.
  // Mirrors camera-drill-i-love-you--desktop: "Current Goal" eyebrow + goal title,
  // then a translucent white/10 panel holding the gold reference chip + helper copy.
  // No i18n key exists for these two strings yet — documented bilingual literals.
  const goalEyebrow = pick(lang, "Current Goal", "هدفك الآن");
  const referenceHelper = pick(
    lang,
    "Follow the reference to unlock the next lesson!",
    "اتبع المرجع لتفتح الدرس التالي!",
  );
  const promptBanner = (
    <div className="relative overflow-hidden rounded-3xl bg-teal p-5 shadow-soft md:p-8">
      <span className="pointer-events-none absolute -end-3 -top-4 opacity-10" aria-hidden="true">
        <Icon name="videocam" fill className="text-8xl leading-none text-white" />
      </span>
      <div className="relative z-10">
        <h3 className="font-display text-xs font-bold uppercase tracking-widest text-white/70">
          {goalEyebrow}
        </h3>
        <div className="mt-1.5 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl font-bold leading-tight text-white md:text-3xl">
              {t("camSign", lang)}: {target}
            </h2>
            {exerciseLabel ? (
              <p className="mt-1.5 font-display text-sm font-bold uppercase tracking-widest text-white/80">
                {exerciseLabel}
              </p>
            ) : (
              <p className="mt-1 text-sm leading-snug text-white/80">
                {pick(lang, sign.hintEn, sign.hintAr)}
              </p>
            )}
            {mode === "grade" && isTrained(sign.id) && (
              <button
                type="button"
                onClick={() => {
                  setMode("teach");
                  setTeachPhase("intro");
                }}
                className="mt-1.5 text-xs font-semibold text-white/70 underline"
              >
                {t("camResetClass", lang)}
              </button>
            )}
          </div>
          {/* MOBILE: standalone gold-bordered reference chip to the right. */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-gold bg-white/20 p-1 backdrop-blur-md md:hidden">
            {referenceChip("text-3xl")}
          </div>
        </div>
        {/* DESKTOP: translucent panel holding the chip alongside helper copy. */}
        <div className="mt-5 hidden items-center gap-4 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm md:inline-flex">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-4 border-gold bg-white/20 p-1">
            {referenceChip("text-3xl")}
          </div>
          <p className="text-sm font-medium leading-snug text-white/90">{referenceHelper}</p>
        </div>
      </div>
    </div>
  );

  // Confidence meter + never-hard-fail actions + privacy chip — shared block.
  const controls = (
    <>
      {/* confidence meter — game power-bar (inset track, gold fill, glowing tip) */}
      {mode === "grade" && tracker.status === "running" && !matched && (
        <div className="space-y-2 px-1">
          <div className="flex items-end justify-between">
            <span className="text-sm font-bold uppercase text-teal/70">
              {holdProgress > 0 ? t("camHold", lang) : t("camConfidence", lang)}
            </span>
            <div className="text-end">
              <span className="font-display text-2xl font-black leading-none text-teal md:text-4xl">
                {Math.round(meter * 100)}%
              </span>
              {/* bilingual "reached!" sublabel — mirrors desktop 'وصلت!' */}
              <span className="mt-0.5 hidden font-display text-base font-bold leading-none text-teal-deep md:block">
                {pick(lang, "وصلت!", "وصلت!")}
              </span>
            </div>
          </div>
          <div
            className="h-5 w-full overflow-hidden rounded-full border-2 border-ink/10 bg-paper p-1 shadow-inner md:h-6"
            role="progressbar"
            aria-valuenow={Math.round(meter * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="flex h-full items-center justify-end rounded-full bg-gold pe-1 transition-all duration-300"
              style={{ width: `${Math.max(6, meter * 100)}%`, boxShadow: "0 0 15px rgba(230,178,76,.6)" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white/60 blur-[1px]" aria-hidden="true" />
            </div>
          </div>
        </div>
      )}

      {/* never-hard-fail controls (§6.4 — self-mark ALWAYS available,
          including teach mode and blocked/absent cameras) */}
      {!matched && (
        <div className="flex flex-col items-center gap-3">
          {showUnsure && (
            <p className="w-full rounded-2xl bg-gold/15 px-4 py-3 text-sm font-medium text-ink">
              {t("camUnsure", lang)}
            </p>
          )}
          <Button variant="primary" full onClick={() => finishResult("selfMark")} className="!rounded-3xl !py-5">
            <span className="flex items-center justify-center gap-2 font-display text-lg">
              <Icon name="check_circle" className="text-xl leading-none" />
              {t("camSelfMark", lang)}
            </span>
            <span className="mt-0.5 block text-[10px] font-normal uppercase tracking-widest text-white/60">
              {t("camSelfMarkSub", lang)}
            </span>
          </Button>
          {allowSkip && (
            <Button variant="ghost" full onClick={() => finishResult("skip")} className="!border-0 !min-h-0 !py-2 text-sm uppercase tracking-[0.2em] !text-teal/60">
              {t("camSkip", lang)}
            </Button>
          )}
        </div>
      )}

      {/* privacy chip — rendered in every state */}
      <div className="flex justify-center">
        <span className="flex items-center gap-2 rounded-full border border-ink/5 bg-white/60 px-4 py-2 backdrop-blur-sm">
          <Icon name="verified_user" className="text-base leading-none text-teal" />
          <span className="text-[11px] font-medium leading-tight text-ink/70">{t("camPrivacy", lang)}</span>
        </span>
      </div>
    </>
  );

  return (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-[1fr_minmax(380px,440px)] md:items-stretch md:gap-6">
      {/* MOBILE: prompt banner first. DESKTOP: lives in the right control panel. */}
      <div className="md:hidden">{promptBanner}</div>

      {/* camera viewport — dark teal-ink rounded stage (left column on desktop) */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-bowl border-4 border-white/10 bg-teal-ink shadow-2xl md:aspect-auto md:min-h-[560px] md:rounded-3xl">
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
        {/* feed vignette */}
        <div
          className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-t from-teal-ink/80 via-transparent to-transparent"
          aria-hidden="true"
        />

        {/* gold fit_screen corner badge (camera-drill-i-love-you--desktop) */}
        <div className="pointer-events-none absolute bottom-4 end-4 z-10" aria-hidden="true">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-4 border-gold/40">
            <Icon name="fit_screen" className="text-2xl leading-none text-gold" />
          </div>
        </div>

        {/* status pills */}
        <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between" dir="ltr">
          <span className="flex items-center gap-1.5 rounded-full bg-teal/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            <Icon
              name="back_hand"
              fill
              className={`text-sm leading-none ${tracker.handVisible ? "text-gold" : "text-white/50"}`}
            />
            {tracker.status === "loading"
              ? t("camLoading", lang)
              : tracker.handVisible
                ? t("camHandSeen", lang)
                : t("camLooking", lang)}
          </span>
          {tracker.status === "running" && (
            <span className="rounded-lg bg-black/40 px-2 py-1 font-display text-[10px] font-bold text-white/80">
              {tracker.fps} FPS
            </span>
          )}
        </div>

        {/* idle → start */}
        {tracker.status === "idle" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <Icon name="videocam" fill className="text-6xl leading-none text-white/80" />
            <Button variant="gold" onClick={() => void tracker.start()}>
              {t("camStart", lang)}
            </Button>
            <p className="text-xs text-white/70">{t("camPrivacy", lang)}</p>
          </div>
        )}

        {/* camera blocked */}
        {tracker.status === "error" && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <Icon name="videocam_off" className="text-5xl leading-none text-white/70" />
            <p className="font-semibold text-white">{t("camBlocked", lang)}</p>
            <p className="text-xs text-white/60">{tracker.error}</p>
            <Button variant="gold" onClick={() => void tracker.start()}>
              {t("camTryAgain", lang)}
            </Button>
          </div>
        )}

        {/* hold-to-confirm ring */}
        {mode === "grade" && tracker.status === "running" && !matched && (
          <div className="absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 md:bottom-10 md:gap-6">
            {/* 80px ring on mobile, 128px on desktop (camera-drill-i-love-you--desktop) */}
            <div className="relative flex h-20 w-20 items-center justify-center md:h-32 md:w-32">
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 80 80" aria-hidden="true">
                <circle cx="40" cy="40" r="36" fill="transparent" stroke="rgba(255,255,255,.12)" strokeWidth="8" />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="transparent"
                  stroke="#E6B24C"
                  strokeLinecap="round"
                  strokeWidth="8"
                  strokeDasharray={HOLD_RING_C}
                  strokeDashoffset={HOLD_RING_C * (1 - holdProgress)}
                  style={{ transition: "stroke-dashoffset .15s linear" }}
                />
              </svg>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg md:h-20 md:w-20">
                <Icon name="check" className="text-3xl font-bold leading-none text-teal md:text-4xl" />
              </div>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-white drop-shadow-md md:hidden">
              {t("camHold", lang)}
            </span>
            {/* desktop: pulsing "Hold steady for 2 seconds" caption */}
            <p className="hidden animate-pulse text-center font-bold text-gold drop-shadow-md md:block">
              {pick(lang, "Hold steady for 2 seconds…", "ثبّت يدك ثانيتين…")}
            </p>
          </div>
        )}

        {/* teach overlay */}
        {mode === "teach" && tracker.status !== "idle" && tracker.status !== "error" && (
          <div className="absolute inset-x-3 bottom-3 z-10 rounded-2xl bg-teal-deep/80 p-4 text-white backdrop-blur">
            {teachPhase === "intro" && (
              <>
                <p className="flex items-center gap-2 font-display font-bold">
                  <Icon name="psychology" className="text-xl leading-none text-gold" />
                  {t("camTeach", lang)}
                </p>
                <p className="mt-1 text-sm text-white/85">{t("camTeachSub", lang)}</p>
                <Button variant="gold" className="mt-3 w-full !py-3" onClick={startTeach}>
                  {t("camStart", lang)}
                </Button>
              </>
            )}
            {teachPhase === "capturing" && (
              <>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display font-bold">{t("camTeachHold", lang)}</p>
                  {/* samples counter chip */}
                  <span className="shrink-0 rounded-full bg-teal-deep px-2.5 py-1 font-display text-xs font-bold uppercase tracking-wide text-gold">
                    {captured}/{TEACH_TARGET} {t("camSamples", lang)}
                  </span>
                </div>
                <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-gold transition-all"
                    style={{ width: `${(captured / TEACH_TARGET) * 100}%`, boxShadow: "0 0 10px rgba(230,178,76,.6)" }}
                  />
                </div>
              </>
            )}
            {teachPhase === "done" && (
              <>
                <p className="flex items-center gap-1.5 font-bold text-gold">
                  <Icon name="check_circle" fill className="text-xl leading-none" />
                  {t("camTeachDone", lang)}
                </p>
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

        {/* matched! */}
        {matched && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-teal-deep/70 backdrop-blur-sm">
            <Icon name="check_circle" fill className="animate-pop-in text-7xl leading-none text-gold" />
            <p className="animate-rise mt-2 font-display text-2xl font-bold text-gold">{t("camMatch", lang)}</p>
          </div>
        )}
      </div>

      {/* MOBILE: controls flow under the viewport.
          DESKTOP: right-hand control panel mirroring camera-drill-i-love-you--desktop. */}
      <div className="contents md:flex md:flex-col md:gap-6 md:rounded-3xl md:bg-paper/60 md:p-6 md:shadow-soft">
        {/* prompt banner repeats here only at md+ (hidden on mobile to avoid a duplicate) */}
        <div className="hidden md:block">{promptBanner}</div>
        {controls}
      </div>
    </div>
  );
}
