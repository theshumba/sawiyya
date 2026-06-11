import { useEffect } from "react";
import { applyDir } from "./i18n";
import { activeProfile, useApp } from "./store/app";
import { useUi } from "./store/ui";
import { BottomNav } from "./components/BottomNav";
import { Home } from "./screens/Home";
import { Onboarding } from "./screens/Onboarding";
import { CameraPractice } from "./screens/CameraPractice";
import { FirstSign } from "./screens/FirstSign";
import { LessonPlayer } from "./screens/LessonPlayer";
import { Stub } from "./screens/Stub";

const NAV_SCREENS = new Set(["home", "camera", "family", "progress"]);

export default function App() {
  const app = useApp();
  const { screen } = useUi();
  const profile = activeProfile(app);
  const lang = profile?.language ?? "en";

  useEffect(() => {
    applyDir(lang);
  }, [lang]);

  if (!app.onboarded || !profile) {
    return <Onboarding />;
  }

  return (
    <>
      <main>
        {screen.name === "home" && <Home />}
        {screen.name === "camera" && (
          <CameraPractice key={screen.targetSignId ?? "free"} initialSignId={screen.targetSignId} />
        )}
        {screen.name === "firstSign" && <FirstSign />}
        {screen.name === "lesson" && (
          <LessonPlayer key={screen.lessonId} lessonId={screen.lessonId} />
        )}
        {screen.name === "family" && <Stub title="Family (M6)" />}
        {screen.name === "flagPicker" && <Stub title="Flags (M6)" />}
        {screen.name === "progress" && <Stub title="Progress (M7)" />}
        {screen.name === "settings" && <Stub title="Settings (M7)" />}
        {screen.name === "aiTransparency" && <Stub title="AI transparency (M7)" />}
        {screen.name === "privacy" && <Stub title="Privacy (M7)" />}
        {screen.name === "devMetrics" && <Stub title="Dev metrics (M7)" />}
      </main>
      {NAV_SCREENS.has(screen.name) && <BottomNav lang={lang} />}
    </>
  );
}
