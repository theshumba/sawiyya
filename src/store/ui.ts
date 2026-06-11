// Screen routing — simple state router (single-page PWA, GH-Pages-safe, not persisted).
import { create } from "zustand";

export type Screen =
  | { name: "home" }
  | { name: "lesson"; lessonId: string; reviewOnly?: boolean }
  | { name: "camera"; targetSignId?: string }
  | { name: "family" }
  | { name: "flagPicker" }
  | { name: "progress" }
  | { name: "settings" }
  | { name: "aiTransparency" }
  | { name: "privacy" }
  | { name: "devMetrics" }
  | { name: "firstSign" };

interface UiState {
  screen: Screen;
  go: (screen: Screen) => void;
}

export const useUi = create<UiState>((set) => ({
  screen: { name: "home" },
  go: (screen) => {
    set({ screen });
    window.scrollTo({ top: 0 });
  },
}));
