import { lazy, Suspense, useEffect, useState } from "react";
import { applyDir, langFromSearch, t, type TKey } from "./i18n";
import { activeProfile, RECOVERY_NOTICE_KEY, useApp } from "./store/app";
import { Card, SpringButton } from "./components/dc";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useUi } from "./store/ui";
import type { Screen } from "./store/ui";
import { Home } from "./screens/Home";
import { Onboarding } from "./screens/Onboarding";
import { Family } from "./screens/Family";
import { FlagPicker } from "./screens/FlagPicker";
import { Progress } from "./screens/Progress";
import { Settings } from "./screens/Settings";
import { AiTransparency, Privacy } from "./screens/InfoPages";
import { DevMetrics } from "./screens/DevMetrics";
import { AllSigns } from "./screens/AllSigns";
import { PractiseChooser } from "./screens/PractiseChooser";

// M13: the camera screens pull in the whole recognizer stack — @mediapipe
// tasks-vision, CameraTrainer, the MLP — none of which the app shell needs on
// boot. Lazy-load them so they land in their own chunk (with the dynamic-imported
// seeds), fetched the first time a learner opens a camera. autoStart still fires
// once the chunk resolves; the Suspense fallback only flashes on that first open.
const CameraPractice = lazy(() =>
  import("./screens/CameraPractice").then((m) => ({ default: m.CameraPractice })),
);
const FirstSign = lazy(() =>
  import("./screens/FirstSign").then((m) => ({ default: m.FirstSign })),
);
const LessonPlayer = lazy(() =>
  import("./screens/LessonPlayer").then((m) => ({ default: m.LessonPlayer })),
);
const Fingerspell = lazy(() =>
  import("./screens/Fingerspell").then((m) => ({ default: m.Fingerspell })),
);

// M16: SPA screen transitions were silent for screen readers — no focus move,
// no announcement. A titled live region covers every route without requiring
// every screen to carry a real <h1> (many use the <Title> component instead).
const SCREEN_TITLE_KEY: Partial<Record<Screen["name"], TKey>> = {
  home: "navLearn",
  lesson: "srLesson",
  camera: "navPractise",
  allSigns: "navDictionary",
  family: "navFamily",
  progress: "navProgress",
  settings: "setTitle",
  practiseChooser: "practiseTitle",
  fingerspell: "fspTitle",
  flagPicker: "famFlagTitle",
  firstSign: "srFirstSign",
  aiTransparency: "setAi",
  privacy: "setPrivacy",
  // devMetrics deliberately unmapped — dev-only English counters screen; a
  // learner-facing announcement for it would be wrong.
};

/** Quiet centred loader shown while a lazy screen chunk resolves. */
function ScreenLoading() {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center" role="status" aria-live="polite">
      <span
        className="h-8 w-8 animate-spin rounded-full border-[3px] border-line border-t-teal"
        aria-hidden="true"
      />
      <span className="sr-only">Loading… · جارٍ التحميل…</span>
    </div>
  );
}

/**
 * One-time honest notice when a corrupt saved blob was backed up and the app
 * restarted fresh (M21). Shown in BOTH languages: after a wipe the language
 * preference itself may be gone, so we can't guess which one the user reads.
 */
function RecoveryNotice({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed inset-x-0 top-0 z-50 p-3" role="alert">
      <Card className="mx-auto max-w-md space-y-3 p-4">
        <div dir="ltr" lang="en">
          <p className="font-bold text-ink">{t("recoveryTitle", "en")}</p>
          <p className="mt-1 text-sm text-ink/70">{t("recoveryBody", "en")}</p>
        </div>
        <div dir="rtl" lang="ar">
          <p className="font-bold text-ink">{t("recoveryTitle", "ar")}</p>
          <p className="mt-1 text-sm text-ink/70">{t("recoveryBody", "ar")}</p>
        </div>
        <SpringButton variant="teal" size="sm" onClick={onDismiss}>
          {t("recoveryDismiss", "en")} · {t("recoveryDismiss", "ar")}
        </SpringButton>
      </Card>
    </div>
  );
}

export default function App() {
  // Scope the root subscription so an unrelated metric/SRS write doesn't re-render
  // the whole screen tree (Q4) — App only needs onboarding state + the active profile.
  const onboarded = useApp((s) => s.onboarded);
  const profile = useApp(activeProfile);
  const { screen } = useUi();
  // Pre-profile (first run) the landing's ?lang=ar handoff decides the default
  // language/direction (M27); once a profile exists its language always wins.
  const lang = profile?.language ?? langFromSearch(window.location.search) ?? "en";

  // Corrupt-blob recovery notice (M21) — flagged by the persist storage guard.
  const [showRecovery, setShowRecovery] = useState(
    () => localStorage.getItem(RECOVERY_NOTICE_KEY) === "1",
  );
  const dismissRecovery = () => {
    localStorage.removeItem(RECOVERY_NOTICE_KEY);
    setShowRecovery(false);
  };

  useEffect(() => {
    applyDir(lang);
  }, [lang]);

  // M16: announce the destination screen on every SPA route change.
  const [announce, setAnnounce] = useState("");
  useEffect(() => {
    const key = SCREEN_TITLE_KEY[screen.name];
    setAnnounce(key ? t(key, lang) : "");
  }, [screen.name, lang]);

  if (!onboarded || !profile) {
    return (
      <>
        {showRecovery && <RecoveryNotice onDismiss={dismissRecovery} />}
        <Onboarding />
      </>
    );
  }

  return (
    <>
      {showRecovery && <RecoveryNotice onDismiss={dismissRecovery} />}
      {/* M16: screen-change announcement — covers every route without requiring
          each screen to carry a real <h1> (many use the <Title> component). */}
      <span role="status" aria-live="polite" className="sr-only">
        {announce}
      </span>
      <main>
        {/* One boundary for the lazy camera screens (M13); the eager screens
            below never suspend, so it only ever shows while a camera chunk loads. */}
        <Suspense fallback={<ScreenLoading />}>
        {screen.name === "home" && <Home />}
        {/* Camera screens get their own boundary (H12): the MediaPipe/camera
            stack is the riskiest subtree, and "try again" just re-mounts it. */}
        {screen.name === "camera" && (
          <ErrorBoundary scope="section">
            <CameraPractice
              key={screen.targetSignId ?? "free"}
              initialSignId={screen.targetSignId}
              autoStart={screen.autoStart}
            />
          </ErrorBoundary>
        )}
        {screen.name === "firstSign" && (
          <ErrorBoundary scope="section">
            <FirstSign />
          </ErrorBoundary>
        )}
        {screen.name === "lesson" && (
          <ErrorBoundary scope="section">
            <LessonPlayer key={screen.lessonId} lessonId={screen.lessonId} />
          </ErrorBoundary>
        )}
        {screen.name === "family" && <Family />}
        {screen.name === "flagPicker" && <FlagPicker />}
        {screen.name === "progress" && <Progress />}
        {screen.name === "allSigns" && (
          <AllSigns key={screen.signId ?? "browse"} initialSignId={screen.signId} />
        )}
        {screen.name === "practiseChooser" && <PractiseChooser />}
        {/* Fingerspell drives the camera in practise-along — same risky subtree
            treatment as the other camera screens (H12). */}
        {screen.name === "fingerspell" && (
          <ErrorBoundary scope="section">
            <Fingerspell />
          </ErrorBoundary>
        )}
        {screen.name === "settings" && <Settings />}
        {screen.name === "aiTransparency" && <AiTransparency />}
        {screen.name === "privacy" && <Privacy />}
        {screen.name === "devMetrics" && <DevMetrics />}
        </Suspense>
      </main>
    </>
  );
}
