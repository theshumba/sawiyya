// Screen routing: hash router (single-page PWA, GH-Pages-safe, not persisted).
//
// H1 (2026-08-01 coherence audit): this used to be a single Zustand atom with no
// history at all, so on an installed Android PWA the hardware Back button and the
// back gesture closed Sawiyya from every screen, mid-lesson and mid-drill, and a
// refresh always dumped the learner on Home. Every screen now serialises to a
// hash URL ("#/words", "#/camera/alpha-alif"), pushed with pushState and read
// back on popstate. Hash rather than path so GitHub Pages needs no rewrite rule,
// `base: "./"` keeps working, and the landing's ?lang=ar handoff (M27) survives
// untouched in the query string.
import { create } from "zustand";

export type Screen =
  | { name: "home" }
  | { name: "lesson"; lessonId: string; reviewOnly?: boolean }
  | { name: "camera"; targetSignId?: string; autoStart?: boolean }
  | { name: "family" }
  | { name: "flagPicker" }
  | { name: "progress" }
  | { name: "settings" }
  | { name: "aiTransparency" }
  | { name: "privacy" }
  | { name: "devMetrics" }
  | { name: "firstSign" }
  // Phase 4 folded the Words screen into this one as a filter; 2026-08-05
  // removed the words themselves, so the filter went with them and only the
  // address survives (see hashToScreen).
  | { name: "allSigns"; signId?: string }
  | { name: "practiseChooser" }
  | { name: "fingerspell" };

/**
 * Screen → "#/…". Params that identify WHAT is on screen (lesson id, sign id)
 * round-trip; `autoStart` deliberately does not. It is a one-shot intent from
 * the onboarding fast-path, and reviving it out of history would open the camera
 * (and fire a permission prompt) on a learner who only pressed Back.
 */
export function screenToHash(screen: Screen): string {
  switch (screen.name) {
    case "home":
      return "#/";
    case "lesson":
      return `#/lesson/${encodeURIComponent(screen.lessonId)}${screen.reviewOnly ? "/review" : ""}`;
    case "camera":
      return screen.targetSignId ? `#/camera/${encodeURIComponent(screen.targetSignId)}` : "#/camera";
    case "allSigns":
      return screen.signId ? `#/signs/${encodeURIComponent(screen.signId)}` : "#/signs";
    case "practiseChooser":
      return "#/practise";
    case "flagPicker":
      return "#/flags";
    case "aiTransparency":
      return "#/ai";
    case "devMetrics":
      return "#/dev";
    case "firstSign":
      return "#/first-sign";
    // family · progress · settings · privacy · fingerspell
    default:
      return `#/${screen.name}`;
  }
}

/**
 * "#/…" → Screen. Anything unknown, truncated or malformed lands on Home rather
 * than rendering nothing: a typo in a shared link must never show a blank app.
 */
export function hashToScreen(hash: string): Screen {
  let parts: string[];
  try {
    parts = hash
      .replace(/^#\/?/, "")
      .split("/")
      .filter(Boolean)
      .map(decodeURIComponent);
  } catch {
    return { name: "home" }; // malformed percent-escape
  }
  const head = parts[0] ?? "";
  const a = parts[1];
  const b = parts[2];
  switch (head) {
    case "":
    case "home":
      return { name: "home" };
    case "lesson":
      // A lesson without an id is not a screen we can render.
      return a ? { name: "lesson", lessonId: a, reviewOnly: b === "review" } : { name: "home" };
    case "camera":
      return a ? { name: "camera", targetSignId: a } : { name: "camera" };
    case "signs":
      return a ? { name: "allSigns", signId: a } : { name: "allSigns" };
    case "practise":
      return { name: "practiseChooser" };
    case "flags":
      return { name: "flagPicker" };
    case "ai":
      return { name: "aiTransparency" };
    case "dev":
      return { name: "devMetrics" };
    case "first-sign":
      return { name: "firstSign" };
    case "words":
      // The words are gone (2026-08-05) but the address is not: anyone who
      // bookmarked the word room lands on the dictionary rather than on a 404.
      // One-way on purpose — screenToHash never mints "#/words" again.
      return { name: "allSigns" };
    case "family":
    case "progress":
    case "settings":
    case "privacy":
    case "fingerspell":
      return { name: head };
    default:
      return { name: "home" };
  }
}

// How many entries deep into the app this history entry is. It rides on the
// entry itself (not a module counter) so it stays correct across back, forward
// and a restored tab. 0 means "this is where the session started", which is what
// backOrParent needs to know: popping there leaves the site.
const DEPTH_KEY = "sawiyyaDepth";

function depthOf(state: unknown): number {
  if (state && typeof state === "object" && DEPTH_KEY in state) {
    const d = (state as Record<string, unknown>)[DEPTH_KEY];
    return typeof d === "number" && Number.isFinite(d) ? d : 0;
  }
  return 0;
}

function initialScreen(): Screen {
  if (typeof window === "undefined") return { name: "home" };
  const screen = hashToScreen(window.location.hash);
  // Canonicalise: a cold load on "#/" , on nothing, or on a malformed hash must
  // leave the URL agreeing with what we render, and must mark this entry depth 0.
  window.history.replaceState({ [DEPTH_KEY]: 0 }, "", screenToHash(screen));
  return screen;
}

interface UiState {
  screen: Screen;
  go: (screen: Screen) => void;
  /**
   * Back for the in-content back arrows. Pops the browser history when this app
   * pushed the current entry, so the learner returns exactly where they came
   * from. On a cold load (deep link, PWA start_url, first screen after install)
   * there is no in-app entry to pop and history.back() would leave the site, so
   * it falls through to the screen's parent instead.
   */
  backOrParent: (parent: Screen) => void;
}

export const useUi = create<UiState>((set) => ({
  screen: initialScreen(),
  go: (screen) => {
    set({ screen });
    if (typeof window === "undefined") return;
    const hash = screenToHash(screen);
    if (window.location.hash === hash) {
      // Same URL (e.g. re-targeting the camera at the letter already shown):
      // replace, so Back doesn't have to be pressed twice to do anything.
      window.history.replaceState(window.history.state, "", hash);
    } else {
      window.history.pushState({ [DEPTH_KEY]: depthOf(window.history.state) + 1 }, "", hash);
    }
    window.scrollTo({ top: 0 });
  },
  backOrParent: (parent) => {
    if (typeof window === "undefined") return;
    if (depthOf(window.history.state) > 0) window.history.back();
    else useUi.getState().go(parent);
  },
}));

// One module-level listener for the whole app: the browser owns the history, the
// store just follows it. popstate covers Back/Forward and the back gesture;
// hashchange covers a hand-edited or shared URL, which does not always popstate.
if (typeof window !== "undefined") {
  const syncFromUrl = () => {
    const next = hashToScreen(window.location.hash);
    if (screenToHash(useUi.getState().screen) === screenToHash(next)) return;
    useUi.setState({ screen: next });
    window.scrollTo({ top: 0 });
  };
  window.addEventListener("popstate", syncFromUrl);
  window.addEventListener("hashchange", syncFromUrl);
}
