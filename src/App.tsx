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
import { Family } from "./screens/Family";
import { FlagPicker } from "./screens/FlagPicker";
import { Progress } from "./screens/Progress";
import { Settings } from "./screens/Settings";
import { AiTransparency, Privacy } from "./screens/InfoPages";
import { DevMetrics } from "./screens/DevMetrics";
import { AllSigns } from "./screens/AllSigns";

const NAV_SCREENS = new Set(["home", "camera", "family", "progress", "allSigns"]);

export default function App() {
  // Scope the root subscription so an unrelated metric/SRS write doesn't re-render
  // the whole screen tree (Q4) — App only needs onboarding state + the active profile.
  const onboarded = useApp((s) => s.onboarded);
  const profile = useApp(activeProfile);
  const { screen } = useUi();
  const lang = profile?.language ?? "en";

  useEffect(() => {
    applyDir(lang);
  }, [lang]);

  if (!onboarded || !profile) {
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
        {screen.name === "family" && <Family />}
        {screen.name === "flagPicker" && <FlagPicker />}
        {screen.name === "progress" && <Progress />}
        {screen.name === "allSigns" && <AllSigns />}
        {screen.name === "settings" && <Settings />}
        {screen.name === "aiTransparency" && <AiTransparency />}
        {screen.name === "privacy" && <Privacy />}
        {screen.name === "devMetrics" && <DevMetrics />}
      </main>
      {NAV_SCREENS.has(screen.name) && <BottomNav lang={lang} />}
    </>
  );
}
