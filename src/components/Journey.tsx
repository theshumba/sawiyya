// The getting-started ladder, in two sizes.
//
//  • <JourneyStrip>  — Home. ONE row, and only when the trail cannot already
//    carry it. Phase 1 deleted Home's eight-card stack because it offered nine
//    answers to "what do I do now"; a strip that repeats the trail's own answer
//    would put the first of those nine back. So the strip shows install, review
//    and the family flag — the parts of the app the road does not pass through.
//  • <JourneyLadder> — Progress. The whole ladder as a readout: done, next,
//    later. Disappears for good once there is no next step.
//
// Neither ever renders a step the app cannot honour: see isActionable().
import { useEffect, useState, useSyncExternalStore } from "react";
import { pick, t } from "../i18n";
import type { Lang } from "../types";
import { useApp } from "../store/app";
import { useUi } from "../store/ui";
import { Icon } from "./ui";
import { useDialog } from "./useDialog";
import {
  isActionable,
  nextStep,
  stageOf,
  STEPS,
  type JourneyStep,
} from "../journey/journey";
import {
  canPromptInstall,
  isInstalled,
  onInstallAvailabilityChange,
  promptInstall,
} from "../journey/install";

/** Live "can we offer a one-tap install?" — `beforeinstallprompt` can land after
 *  this component mounts, and a sheet that opened a second too early would show
 *  the written instructions to someone who could have had the button. */
function useCanPromptInstall(): boolean {
  return useSyncExternalStore(onInstallAvailabilityChange, canPromptInstall, () => false);
}

function useJourney() {
  const journey = useApp((s) => s.journey);
  const done = new Set(journey.steps);
  const dismissed = new Set(journey.dismissed);
  return { done, dismissed, stage: stageOf(done, dismissed), next: nextStep(done, dismissed) };
}

// ── Home: one row, or nothing ────────────────────────────────────────────────

export function JourneyStrip({ lang, dueCount }: { lang: Lang; dueCount: number }) {
  const { next } = useJourney();
  const go = useUi((s) => s.go);
  const [installOpen, setInstallOpen] = useState(false);

  // The trail is already saying this, or the step is not honourable yet. Either
  // way Home stays quiet — it never skips ahead to a later step, because array
  // order is the priority and jumping it is how a ladder becomes a rules engine.
  if (!next || next.onTrail || !isActionable(next, { dueCount })) return null;

  const label = pick(lang, next.en, next.ar);
  const body = pick(lang, next.bodyEn, next.bodyAr);

  return (
    <>
      {/* No aria-label: the eyebrow inside already names this, and labelling the
          section too made a screen reader read "Getting started" twice. */}
      <section className="pb-1 pt-4">
        <button
          type="button"
          onClick={() => (next.go ? go(next.go) : setInstallOpen(true))}
          className="flex w-full items-center gap-3 rounded-[18px] border border-line bg-paper p-[15px] text-start transition-transform ease-spring duration-200 active:translate-y-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
          style={{ boxShadow: "0 3px 0 #EDE3D2" }}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-teal/10 text-teal">
            <Icon name={next.id === "install" ? "download_for_offline" : "arrow_forward"} className="!text-2xl rtl:rotate-180" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-mono text-[10px] font-bold uppercase tracking-[.12em] text-muted">
              {t("jrTitle", lang)}
            </span>
            <span className="mt-[3px] block font-display text-[15px] font-bold leading-[1.15] text-ink">
              {label}
            </span>
            <span className="mt-[2px] block text-[12px] leading-[1.35] text-muted">{body}</span>
          </span>
        </button>
      </section>
      {installOpen && <InstallSheet lang={lang} onClose={() => setInstallOpen(false)} />}
    </>
  );
}

// ── Progress: the whole ladder ───────────────────────────────────────────────

export function JourneyLadder({ lang, dueCount }: { lang: Lang; dueCount: number }) {
  const { done, dismissed, stage, next } = useJourney();
  const go = useUi((s) => s.go);
  const dismissStep = useApp((s) => s.dismissStep);
  const [installOpen, setInstallOpen] = useState(false);

  // Once there is nothing left to introduce, the ladder leaves for good. A
  // permanent "6 of 6 complete" panel is a trophy nobody asked for.
  if (stage === "settled") return null;

  const rowFor = (step: JourneyStep) => {
    const isDone = done.has(step.id);
    const isNext = next?.id === step.id;
    const blocked = isNext && !isActionable(step, { dueCount });
    // A step can be both put aside and later done — reviewing after dismissing
    // the review row is ordinary. Done wins: it is the newer, truer fact.
    const putAside = !isDone && dismissed.has(step.id);
    return { isDone, isNext, blocked, putAside };
  };

  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-display text-[17px] font-bold leading-[1.15] text-ink">
          {t("jrTitle", lang)}
        </h3>
        <p className="mt-[3px] text-[13px] leading-[1.35] text-muted">{t("jrBody", lang)}</p>
      </div>

      <ol className="space-y-2">
        {STEPS.map((step) => {
          const { isDone, isNext, blocked, putAside } = rowFor(step);
          const label = pick(lang, step.en, step.ar);
          const tappable = isNext && !blocked;
          const rowClass = `flex w-full items-start gap-3 rounded-[16px] border p-[13px] text-start ${
            tappable
              ? "border-teal bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
              : "border-line bg-paper/60"
          }`;
          const inner = (
            <>
              <span
                aria-hidden
                className={`mt-[1px] flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] ${
                  isDone ? "bg-teal text-paper" : "border-2 border-line bg-transparent text-muted"
                }`}
              >
                {isDone ? "✓" : ""}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block font-display text-[14px] font-bold leading-[1.2] ${
                    isDone ? "text-muted line-through" : "text-ink"
                  }`}
                >
                  {label}
                </span>
                {/* Only the row you are on explains itself. Six explanations at
                    once is the front-loaded tour this phase exists to avoid. */}
                {isNext && (
                  <span className="mt-[3px] block text-[12px] leading-[1.35] text-muted">
                    {blocked ? t("jrWaitingReview", lang) : pick(lang, step.bodyEn, step.bodyAr)}
                  </span>
                )}
                {putAside && (
                  <span className="mt-[3px] block text-[12px] leading-[1.35] text-muted">
                    {t("jrPutAside", lang)}
                  </span>
                )}
              </span>
              {/* Screen-reader state, so the tick and the border are not the only
                  things carrying done / next / later. */}
              <span className="sr-only">
                {isDone ? t("jrDone", lang) : isNext ? t("jrNext", lang) : t("jrLater", lang)}
              </span>
            </>
          );
          return (
            <li key={step.id}>
              {tappable ? (
                <button
                  type="button"
                  onClick={() => (step.go ? go(step.go) : setInstallOpen(true))}
                  className={rowClass}
                >
                  {inner}
                </button>
              ) : (
                <div className={rowClass}>{inner}</div>
              )}
              {isNext && step.dismissible && (
                <button
                  type="button"
                  onClick={() => dismissStep(step.id)}
                  className="mt-1 rounded-lg px-2 py-1 text-[12px] font-medium text-muted underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                >
                  {t("jrNotNow", lang)}
                </button>
              )}
            </li>
          );
        })}
      </ol>
      {installOpen && <InstallSheet lang={lang} onClose={() => setInstallOpen(false)} />}
    </section>
  );
}

// ── the install sheet ────────────────────────────────────────────────────────

function InstallSheet({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const canPrompt = useCanPromptInstall();
  const completeStep = useApp((s) => s.completeStep);
  const ref = useDialog<HTMLDivElement>(true, onClose);
  const [busy, setBusy] = useState(false);

  const install = async () => {
    setBusy(true);
    const accepted = await promptInstall();
    setBusy(false);
    // Only an accepted prompt is an install. A dismissal leaves the step where
    // it was, because nothing happened.
    if (accepted) {
      completeStep("install");
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-40 flex items-end"
      style={{ background: "rgba(22,48,46,.5)" }}
    >
      <div
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("jrInstallTitle", lang)}
        tabIndex={-1}
        className="mx-auto w-full max-w-xl animate-rise focus:outline-none"
        style={{
          background: "#FBF7EF",
          borderRadius: "26px 26px 0 0",
          padding: "22px 22px 26px",
          boxShadow: "0 -10px 40px rgba(0,0,0,.2)",
        }}
      >
        <div style={{ width: 42, height: 5, borderRadius: 99, background: "#EDE3D2", margin: "0 auto 16px" }} />
        <h2 className="font-display text-[20px] font-extrabold leading-[1.1] text-ink">
          {t("jrInstallTitle", lang)}
        </h2>
        <p className="mt-2 text-[13px] leading-[1.45] text-muted">{t("jrInstallWhy", lang)}</p>

        {canPrompt ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void install()}
            className="mt-5 block w-full rounded-2xl border-none bg-teal py-[15px] text-center font-display text-[16px] font-bold text-paper disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            style={{ boxShadow: "0 5px 0 #0A4F4C" }}
          >
            {t("jrInstallCta", lang)}
          </button>
        ) : (
          // No API on iOS Safari, and none on a desktop browser that has already
          // spent its prompt. Written steps beat a button that does nothing.
          <ol className="mt-4 space-y-2 text-[13px] leading-[1.45] text-ink">
            <li>{t("jrInstallIos1", lang)}</li>
            <li>{t("jrInstallIos2", lang)}</li>
            <li>{t("jrInstallAndroid", lang)}</li>
          </ol>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 block w-full rounded-2xl bg-transparent py-3 text-center font-display text-[14px] font-bold text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
        >
          {t("close", lang)}
        </button>
      </div>
    </div>
  );
}

// ── the one hint an empty state may show ─────────────────────────────────────

/** Renders nothing unless this session's hint budget lands here. */
export function HintNote({ lang, text }: { lang: Lang; text: string | null }) {
  if (!text) return null;
  return (
    <p
      lang={lang}
      className="mt-3 rounded-[14px] border border-dashed border-teal/30 bg-teal/5 p-3 text-[12px] leading-[1.45] text-ink/80"
    >
      {text}
    </p>
  );
}

/** Detects a live install at boot and banks the step. Mounted once, by App.
 *  `install` is the one step nothing in the app can make happen, so this is the
 *  only place it is ever claimed — off an observed display mode, never a guess. */
export function useInstallDetection() {
  const completeStep = useApp((s) => s.completeStep);
  useEffect(() => {
    if (isInstalled()) completeStep("install");
  }, [completeStep]);
}
