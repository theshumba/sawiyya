// "Keep your progress" — the install step's plumbing (plan point 7).
//
// Two platforms, two completely different affordances, and the app has to be
// honest about which one it is on:
//   • Android / Chromium fire `beforeinstallprompt`, which can be deferred and
//     replayed from a real user gesture. That is a one-tap install.
//   • iOS Safari fires nothing and exposes no API. All we can do is write the
//     steps down. Pretending otherwise would be a button that does nothing.
//
// The listener registers at import time because `beforeinstallprompt` fires
// early — a listener added when the sheet opens has already missed it.

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const fn of listeners) fn();
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

/** Already running as an installed app? `display-mode: standalone` covers
 *  Android/desktop; `navigator.standalone` is the iOS-only equivalent. */
export function isInstalled(): boolean {
  if (typeof window === "undefined") return false;
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches ?? false;
  const ios = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standalone || ios;
}

/** Can we offer a real one-tap install, or only written instructions? */
export function canPromptInstall(): boolean {
  return deferred !== null;
}

/** Fire the deferred prompt. Returns true only if the learner accepted, so the
 *  caller never marks the step done on a dismissal. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const e = deferred;
  deferred = null; // a deferred prompt is single-use
  notify();
  try {
    await e.prompt();
    const { outcome } = await e.userChoice;
    return outcome === "accepted";
  } catch {
    return false;
  }
}

/** Re-render when install availability changes (the event can land after mount). */
export function onInstallAvailabilityChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
