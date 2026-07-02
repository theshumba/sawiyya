import { useEffect, useState } from "react";
import { applyDir, langFromSearch, t } from "./i18n";
import { activeProfile, RECOVERY_NOTICE_KEY, useApp } from "./store/app";
import { Card, SpringButton } from "./components/dc";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useUi } from "./store/ui";
import { Home } from "./screens/Home";
import { Onboarding } from "./screens/Onboarding";
import { CameraPractice } from "./screens/CameraPractice";
import { FirstSign } from "./screens/FirstSign";
import { LessonPlayer } from "./screens/LessonPlayer";
import { Family } from "./screens/Family";
import { FlagPicker } from "./screens/FlagPicker";
import { Progress } from "./screens/Progress";
import { Settings } from "./screens/Settings";
import { AiTransparency, Privacy } from "./screens/InfoPages";
import { DevMetrics } from "./screens/DevMetrics";
import { AllSigns } from "./screens/AllSigns";
import { PractiseChooser } from "./screens/PractiseChooser";

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
      <main>
        {screen.name === "home" && <Home />}
        {/* Camera screens get their own boundary (H12): the MediaPipe/camera
            stack is the riskiest subtree, and "try again" just re-mounts it. */}
        {screen.name === "camera" && (
          <ErrorBoundary scope="section">
            <CameraPractice
              key={screen.targetSignId ?? "free"}
              initialSignId={screen.targetSignId}
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
        {screen.name === "allSigns" && <AllSigns />}
        {screen.name === "practiseChooser" && <PractiseChooser />}
        {screen.name === "settings" && <Settings />}
        {screen.name === "aiTransparency" && <AiTransparency />}
        {screen.name === "privacy" && <Privacy />}
        {screen.name === "devMetrics" && <DevMetrics />}
      </main>
    </>
  );
}
