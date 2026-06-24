# Sawiyya Honest Grading + Onboarding Revamp — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Sawiyya's alphabet practice genuinely grade a real hand against real signers (no more "instant yes"), lead the first run with a real graded sign, and clean up onboarding + landing-page messaging — ready for Mada Innovation Award review.

**Architecture:** Extract ground-truth hand-landmark vectors from real Arabic-alphabet photo datasets **in the browser**, through the *exact same* `normalizeLandmarks()` used by the live camera, and ship them as a bundled JSON the KNN recognizer loads as a read-only base layer. The alphabet then grades against real signers; QSL words stay teach-mode but are labelled honestly. Onboarding and landing changes are focused edits, no re-theme.

**Tech Stack:** Vite 5 + React 18 + TypeScript 5, Tailwind 3, Zustand, `@mediapipe/tasks-vision` 0.10.14 (HandLandmarker), Vitest (added in Task 1) for pure-logic tests.

## Global Constraints

- **Feature vectors are 42-dim** (21 landmarks × x,y), wrist-relative, scale-normalised, mirror-canonicalised — produced ONLY by `src/recognizer/normalize.ts::normalizeLandmarks(lms, mirror)`. Ground-truth seeds MUST be built through this same function. Never hand-roll a second normaliser.
- **On-device only.** No network calls added at runtime; nothing leaves the device. Seeds ship in the bundle.
- **Alphabet class ids are `alpha-<id>`** as defined in `src/content/signs.ts` (e.g. `ا` → `alpha-alif`). Seed JSON keys MUST use these exact ids.
- **Seeds are read-only at runtime** — never written to `localStorage`; user teach-samples (words) continue to persist to `localStorage` key `sawiyya.knn.v1`.
- **Honesty rule:** no UI surface may imply a sign is pre-graded unless it is. "Ready" badge only where real seeds exist (alphabet).
- **Bilingual:** all user-facing copy changes ship EN + AR (`data-ar` on the landing page; `pick()`/`t()` in the app).
- **Brand tokens:** teal `#148580`, gold `#E6B24C`, coral `#E8654C`, sand/paper — reuse existing Tailwind classes; no new palette.
- **Datasets are research-use** for the award; record attribution in `src/recognizer/seeds/SOURCES.md`.

---

## File Structure

| File | Responsibility | Tasks |
|---|---|---|
| `vitest.config.ts` (new) | Test runner config (jsdom env for localStorage) | 1 |
| `package.json` | add `vitest`, `jsdom`; add `test` script | 1 |
| `src/recognizer/seeds/alphabet.json` (new) | Bundled ground-truth vectors `{ [alphaId]: number[][] }` | 2 (fixture) → 3 (real) |
| `src/recognizer/seeds/SOURCES.md` (new) | Dataset attribution + how seeds were built | 3 |
| `src/recognizer/knn.ts` | Load seeds as read-only base layer; read paths span seeds+user; stricter gates | 2, 4 |
| `src/recognizer/knn.test.ts` (new) | Unit tests for seed merge + grading | 2 |
| `src/recognizer/calibration.ts` (new) | Pure metric: true-accept / false-accept over a labelled split | 4 |
| `src/recognizer/calibration.test.ts` (new) | Unit test for the metric | 4 |
| `tools/extract-seeds/index.html` + `extract.ts` (new) | One-time **browser** harness: images → MediaPipe → normalize → JSON + threshold sweep | 3, 4 |
| `src/screens/FirstSign.tsx` | First graded sign → `alpha-alif` (real-graded) | 5 |
| `src/components/CameraTrainer.tsx` | Hold time >1s; honest teach-mode copy | 4, 5 |
| `src/screens/Onboarding.tsx` | Strip AI persona art + emoji → premium brand glyphs; honest badges | 6 |
| `src/i18n.ts` | New/return relabel strings | 5, 6 |
| `~/Desktop/Projects/sawiyya-landing/index.html` | "Together, as equals" lead; Deaf-can-use-it block | 7 |

**Dependency order:** 1 → 2 → 3 → 4 → 5; 6 and 7 are independent (can run any time after 1). Task 5 depends on real seeds (3) and stricter gates (4) for Alif to grade honestly.

---

### Task 1: Add the test runner

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`
- Test: `src/recognizer/smoke.test.ts` (temporary, deleted in step 6)

**Interfaces:**
- Produces: `npm test` runs Vitest in jsdom (so `localStorage` exists for recognizer tests).

- [ ] **Step 1: Install dev deps**

Run:
```bash
cd ~/Documents/GitHub/sawiyya && npm i -D vitest@^2 jsdom@^25
```
Expected: `vitest` and `jsdom` appear in `devDependencies`.

- [ ] **Step 2: Add the config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Add the test script**

In `package.json` `"scripts"`, add:
```json
"test": "vitest run"
```

- [ ] **Step 4: Write a smoke test**

Create `src/recognizer/smoke.test.ts`:
```ts
import { describe, expect, it } from "vitest";

describe("test runner", () => {
  it("has localStorage in jsdom", () => {
    localStorage.setItem("k", "v");
    expect(localStorage.getItem("k")).toBe("v");
  });
});
```

- [ ] **Step 5: Run it**

Run: `npm test`
Expected: PASS, 1 test.

- [ ] **Step 6: Delete the smoke test and commit**

```bash
rm src/recognizer/smoke.test.ts
git add package.json package-lock.json vitest.config.ts
git commit -m "test: add vitest runner (jsdom env)"
```

---

### Task 2: Seeds base layer in the recognizer

Make the KNN read from a bundled read-only seed store **in addition to** the user's `localStorage` samples, so alphabet classes are "trained" from real data with no teach step. Writes still only touch the user store.

**Files:**
- Create: `src/recognizer/seeds/alphabet.json` (synthetic fixture — replaced with real data in Task 3)
- Modify: `src/recognizer/knn.ts`
- Modify: `tsconfig` only if `resolveJsonModule` is not already enabled (check first)
- Test: `src/recognizer/knn.test.ts`

**Interfaces:**
- Consumes: `euclidean` from `./normalize`, `TAU` (existing export).
- Produces (knn.ts new/changed exports):
  - `__setSeedsForTest(s: Record<string, number[][]>): void` — test-only seed injection.
  - `classifyAgainst(vec: number[], targetId: string): TargetClassification` — now spans seeds + user store.
  - `sampleCount`, `isTrained`, `trainedClassIds` — now count seeds + user store.

- [ ] **Step 1: Create the fixture seed file**

Create `src/recognizer/seeds/alphabet.json` with two classes of trivially-separable 42-dim vectors (zeros vs ones), enough that each is "trained" (≥8):
```json
{
  "alpha-alif": [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.01],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.02],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.03],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.04],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.05],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.06],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.07]
  ],
  "alpha-ba": [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1.01],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1.02],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1.03],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1.04],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1.05],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1.06],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1.07]
  ]
}
```

- [ ] **Step 2: Confirm JSON imports are allowed**

Run: `grep -n resolveJsonModule tsconfig*.json`
Expected: present. If NOT present, add `"resolveJsonModule": true` to the `compilerOptions` of the tsconfig that covers `src` (typically `tsconfig.app.json`), then re-run the grep to confirm.

- [ ] **Step 3: Write the failing tests**

Create `src/recognizer/knn.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import {
  __setSeedsForTest,
  classifyAgainst,
  isTrained,
  sampleCount,
  trainedClassIds,
} from "./knn";

const v0 = (tail = 0) => [...Array(41).fill(0), tail];
const v1 = (tail = 1) => [...Array(41).fill(1), tail];

beforeEach(() => {
  localStorage.clear();
  // fresh seeds per test: two separable classes, 8 samples each
  __setSeedsForTest({
    "alpha-alif": Array.from({ length: 8 }, (_, i) => v0(i / 100)),
    "alpha-ba": Array.from({ length: 8 }, (_, i) => v1(1 + i / 100)),
  });
});

describe("seeds base layer", () => {
  it("treats a seeded class as trained without any user samples", () => {
    expect(isTrained("alpha-alif")).toBe(true);
    expect(sampleCount("alpha-alif")).toBeGreaterThanOrEqual(8);
    expect(trainedClassIds()).toEqual(expect.arrayContaining(["alpha-alif", "alpha-ba"]));
  });

  it("matches a vector near the target's seeds", () => {
    const res = classifyAgainst(v0(0), "alpha-alif");
    expect(res.matched).toBe(true);
    expect(res.confidence).toBeGreaterThan(0.7);
  });

  it("rejects a vector that belongs to a different class", () => {
    const res = classifyAgainst(v1(1), "alpha-alif"); // signing 'ba' while target is 'alif'
    expect(res.matched).toBe(false);
  });

  it("rejects an out-of-distribution handshape (the 'instant yes' bug)", () => {
    const wild = Array(42).fill(5); // far from every seed
    expect(classifyAgainst(wild, "alpha-alif").matched).toBe(false);
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npm test -- knn`
Expected: FAIL — `__setSeedsForTest` is not exported yet.

- [ ] **Step 5: Implement the seed layer in `knn.ts`**

At the top of `src/recognizer/knn.ts`, after the `euclidean` import, add:
```ts
import seedData from "./seeds/alphabet.json";
```
Add a seed store + test hook near the `SampleStore` type:
```ts
// Bundled, read-only ground-truth vectors (alphabet). Never written to localStorage.
let seeds: SampleStore = seedData as SampleStore;
/** TEST-ONLY: replace the bundled seeds with a fixture. */
export function __setSeedsForTest(s: SampleStore) {
  seeds = s;
}
/** All stores read paths must span — seeds first, then the user's localStorage store. */
function readStores(): SampleStore[] {
  return [seeds, store()];
}
```
Replace `sampleCount`, `isTrained` is derived from it, and `trainedClassIds`:
```ts
export function sampleCount(classId: string): number {
  return readStores().reduce((n, s) => n + (s[classId]?.length ?? 0), 0);
}

export function trainedClassIds(): string[] {
  const ids = new Set<string>();
  for (const s of readStores()) for (const id of Object.keys(s)) ids.add(id);
  return [...ids].filter((id) => sampleCount(id) >= 4);
}
```
In `classifyAgainst`, change the neighbour-collection loop to span both stores. Replace:
```ts
  for (const [classId, samples] of Object.entries(s)) {
    for (const sample of samples) {
```
with:
```ts
  for (const layer of readStores()) {
    for (const [classId, samples] of Object.entries(layer)) {
      for (const sample of samples) {
```
and add one extra closing brace after that inner block (the bounded-insertion body now sits one level deeper — match braces carefully). Remove the now-unused `const s = store();` at the top of `classifyAgainst` if it becomes unused (the function should rely on `readStores()`).

> Note: `addSample` and `clearClass` are unchanged — they still mutate only the user `store()`, so seeds remain immutable.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm test -- knn`
Expected: PASS, 4 tests. Then `npm run build` — Expected: type-checks and builds clean.

- [ ] **Step 7: Commit**

```bash
git add src/recognizer/knn.ts src/recognizer/knn.test.ts src/recognizer/seeds/alphabet.json tsconfig*.json
git commit -m "feat(recognizer): read-only seed base layer for alphabet grading"
```

---

### Task 3: Build real ground-truth seeds from a real dataset

> **DEVIATION (authorised 2026-06-24):** Implemented from the **Zenodo ArSL landmark CSV** (record 18363162, CC-BY-4.0) instead of the 5GB image dataset + browser harness. The CSV already carries raw 21-point landmark coordinates, so a pure Node script feeds them through the SAME `normalizeLandmarks()` — identical 42-dim feature space, no browser, no large download, cleaner license. 28 letter classes get real seeds; the 3 edge forms (ة/لا/ال) aren't in the dataset and stay teach-mode. See `.superpowers/sdd/task-3-brief.md` for the label→id mapping. The original browser-harness text below is retained for context only.

A one-time **browser** harness extracts landmarks from real Arabic-alphabet photos through the same `normalizeLandmarks()`, then writes `alphabet.json`. Browser-based because `@mediapipe/tasks-vision` is browser-only — and it guarantees the seed feature space matches the live camera path exactly.

**Files:**
- Create: `tools/extract-seeds/index.html`, `tools/extract-seeds/extract.ts`
- Create: `src/recognizer/seeds/SOURCES.md`
- Overwrite: `src/recognizer/seeds/alphabet.json` (real data replaces the fixture)

**Interfaces:**
- Consumes: `normalizeLandmarks` from `src/recognizer/normalize.ts`; HandLandmarker (IMAGE mode).
- Produces: `alphabet.json` of `{ "alpha-<id>": number[][] }`, ≤40 vectors/class.

- [ ] **Step 1: Download a real dataset (manual)**

Download **AASL** (kaggle.com/datasets/muhammadalbrham/rgb-arabic-alphabets-sign-language-dataset) or **ArSL21L** (github.com/MoyoG/ArSL21L). Unzip to `tools/extract-seeds/dataset/` as **one folder per letter**, e.g. `dataset/alif/*.jpg`. Add `tools/extract-seeds/dataset/` to `.gitignore` (do not commit raw images).

- [ ] **Step 2: Write the harness page**

Create `tools/extract-seeds/index.html`:
```html
<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>Sawiyya seed extractor</title></head>
  <body>
    <h1>Seed extractor</h1>
    <p>Pick the <code>dataset/</code> folder (one subfolder per letter).</p>
    <input id="dir" type="file" webkitdirectory multiple />
    <button id="run">Extract</button>
    <pre id="log"></pre>
    <script type="module" src="./extract.ts"></script>
  </body>
</html>
```

Create `tools/extract-seeds/extract.ts`:
```ts
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { normalizeLandmarks, type LM } from "../../src/recognizer/normalize";

// Folder name (lowercased) -> alpha-<id>. Adjust keys to match your dataset's folders.
const FOLDER_TO_ID: Record<string, string> = {
  alif: "alpha-alif", ba: "alpha-ba", ta: "alpha-ta", tha: "alpha-tha",
  jeem: "alpha-jeem", haa: "alpha-haa", kha: "alpha-kha", dal: "alpha-dal",
  thal: "alpha-thal", ra: "alpha-ra", zay: "alpha-zay", seen: "alpha-seen",
  sheen: "alpha-sheen", sad: "alpha-sad", dad: "alpha-dad", tah: "alpha-tah",
  zah: "alpha-zah", ain: "alpha-ain", ghain: "alpha-ghain", fa: "alpha-fa",
  qaf: "alpha-qaf", kaf: "alpha-kaf", lam: "alpha-lam", meem: "alpha-meem",
  noon: "alpha-noon", ha: "alpha-ha", waw: "alpha-waw", ya: "alpha-ya",
};
const MAX_PER_CLASS = 40;

const log = (m: string) => { (document.getElementById("log") as HTMLPreElement).textContent += m + "\n"; };

async function getLandmarker() {
  const fileset = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm",
  );
  return HandLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate: "CPU",
    },
    runningMode: "IMAGE",
    numHands: 1,
  });
}

function bitmapFrom(file: File): Promise<ImageBitmap> { return createImageBitmap(file); }

document.getElementById("run")!.addEventListener("click", async () => {
  const input = document.getElementById("dir") as HTMLInputElement;
  const files = [...(input.files ?? [])];
  if (!files.length) return log("No folder selected.");
  const lm = await getLandmarker();
  const out: Record<string, number[][]> = {};

  for (const f of files) {
    // webkitRelativePath looks like "dataset/alif/img001.jpg"
    const parts = f.webkitRelativePath.split("/");
    const folder = parts[parts.length - 2]?.toLowerCase();
    const id = folder && FOLDER_TO_ID[folder];
    if (!id) continue;
    if ((out[id]?.length ?? 0) >= MAX_PER_CLASS) continue;
    try {
      const bmp = await bitmapFrom(f);
      const res = lm.detect(bmp);
      bmp.close();
      if (!res.landmarks?.length) continue;
      const hand = (res.handednesses?.[0]?.[0]?.categoryName as "Left" | "Right") ?? "Right";
      const vec = normalizeLandmarks(res.landmarks[0] as LM[], hand === "Left");
      if (vec.length === 42) (out[id] ??= []).push(vec.map((v) => Math.round(v * 1000) / 1000));
    } catch { /* skip undecodable image */ }
  }

  for (const id of Object.keys(out).sort()) log(`${id}: ${out[id].length}`);
  const blob = new Blob([JSON.stringify(out)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "alphabet.json";
  a.click();
});
```

- [ ] **Step 3: Run the harness**

Run: `npm run dev`, open `http://localhost:5173/tools/extract-seeds/index.html`, pick the `dataset/` folder, click **Extract**. (Vite serves files under the project root; if the path 404s, copy the two files into `public/extract-seeds/` and open `/extract-seeds/index.html`.)
Expected: the log lists each `alpha-*` id with a sample count; `alphabet.json` downloads.

- [ ] **Step 4: Verify coverage, then install the file**

Confirm in the log that **every** alphabet class present in the dataset has **≥8** samples (the `isTrained` floor). If a class is thin, pull more images for it (or supplement from the other dataset) and re-run. Then move the downloaded file:
```bash
mv ~/Downloads/alphabet.json ~/Documents/GitHub/sawiyya/src/recognizer/seeds/alphabet.json
cd ~/Documents/GitHub/sawiyya && node -e "const s=require('./src/recognizer/seeds/alphabet.json');const b=Object.entries(s).filter(([,v])=>v.length<8);if(b.length){console.error('THIN CLASSES:',b.map(([k,v])=>k+':'+v.length));process.exit(1)}console.log('classes:',Object.keys(s).length,'all >=8 OK')"
```
Expected: `all >=8 OK`.

- [ ] **Step 5: Re-run the recognizer tests against real seeds**

Run: `npm test -- knn`
Expected: PASS (tests use `__setSeedsForTest`, so they're independent of the real file — this confirms the real JSON still imports + builds). Then `npm run build` — Expected: clean.

- [ ] **Step 6: Write attribution**

Create `src/recognizer/seeds/SOURCES.md` naming the dataset used, its URL, license (research-use), the date, and a one-paragraph description of the extraction (browser harness → `normalizeLandmarks` → ≤40 vectors/class). Add `tools/extract-seeds/dataset/` to `.gitignore`.

- [ ] **Step 7: Commit**

```bash
git add src/recognizer/seeds/alphabet.json src/recognizer/seeds/SOURCES.md tools/extract-seeds .gitignore
git commit -m "feat(recognizer): real ground-truth alphabet seeds from real dataset"
```

---

### Task 4: Calibrate thresholds so correct passes and wrong fails (and it can't insta-pass)

The existing gates (`DISTANCE_GATE=0.55`, `TAU=0.78`, `MARGIN_GATE=0.15`, `HOLD_FRAMES=10`) were tuned for same-person self-taught samples. Re-tune for cross-person data using a held-out split, and lengthen the hold.

**Files:**
- Create: `src/recognizer/calibration.ts`, `src/recognizer/calibration.test.ts`
- Modify: `tools/extract-seeds/extract.ts` (add a sweep mode)
- Modify: `src/recognizer/knn.ts` (set tuned `DISTANCE_GATE`, `TAU`, `MARGIN_GATE`)
- Modify: `src/components/CameraTrainer.tsx` (`HOLD_FRAMES`)

**Interfaces:**
- Produces: `evaluate(opts): { trueAccept: number; falseAccept: number; n: number }` in `calibration.ts`.

- [ ] **Step 1: Write the failing metric test**

Create `src/recognizer/calibration.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { evaluate } from "./calibration";

const z = (t = 0) => [...Array(41).fill(0), t];
const o = (t = 1) => [...Array(41).fill(1), t];

describe("evaluate", () => {
  const train = { "alpha-alif": [z(), z(0.01), z(0.02)], "alpha-ba": [o(), o(1.01), o(1.02)] };

  it("accepts correct, rejects wrong with separable data", () => {
    const correct = [{ id: "alpha-alif", vec: z(0.005) }, { id: "alpha-ba", vec: o(1.005) }];
    const r = evaluate({ train, test: correct, distanceGate: 0.55, tau: 0.78, margin: 0.15 });
    expect(r.trueAccept).toBe(1); // both correct samples accepted as their own class

    const wrong = [{ id: "alpha-alif", vec: o(1.005) }]; // labelled alif but signs ba
    const w = evaluate({ train, test: wrong, distanceGate: 0.55, tau: 0.78, margin: 0.15 });
    expect(w.falseAccept).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- calibration`
Expected: FAIL — `evaluate` not defined.

- [ ] **Step 3: Implement the metric**

Create `src/recognizer/calibration.ts` — a self-contained re-implementation of the grading decision (so calibration never depends on module-level seeds), reusing `euclidean`:
```ts
import { euclidean } from "./normalize";

type Store = Record<string, number[][]>;
interface Opts {
  train: Store;
  test: { id: string; vec: number[] }[];
  distanceGate: number;
  tau: number;
  margin: number;
  k?: number;
}

function decide(train: Store, vec: number[], target: string, gate: number, tau: number, margin: number, K: number) {
  const top: { c: string; d: number }[] = [];
  for (const [c, samples] of Object.entries(train))
    for (const s of samples) top.push({ c, d: euclidean(vec, s) });
  top.sort((a, b) => a.d - b.d);
  const near = top.slice(0, K);
  const meanD = near.reduce((s, n) => s + n.d, 0) / near.length;
  const w = new Map<string, number>();
  let total = 0;
  for (const n of near) { const x = 1 / (n.d + 0.05); w.set(n.c, (w.get(n.c) ?? 0) + x); total += x; }
  let best = "", bestW = 0, secondW = 0;
  for (const [c, x] of w) { if (x > bestW) { secondW = bestW; bestW = x; best = c; } else if (x > secondW) secondW = x; }
  const share = (w.get(target) ?? 0) / total;
  return meanD <= gate && best === target && share >= tau && (bestW - secondW) / total >= margin;
}

export function evaluate({ train, test, distanceGate, tau, margin, k = 7 }: Opts) {
  let accepted = 0, falseAccept = 0, positives = 0, negatives = 0;
  for (const t of test) {
    const isCorrect = !!train[t.id]; // a labelled-correct sample
    const matched = decide(train, t.vec, t.id, distanceGate, tau, margin, k);
    if (isCorrect) { positives++; if (matched) accepted++; }
    else { negatives++; if (matched) falseAccept++; }
  }
  return {
    trueAccept: positives ? accepted / positives : 0,
    falseAccept: negatives ? falseAccept / negatives : 0,
    n: test.length,
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- calibration`
Expected: PASS.

- [ ] **Step 5: Add a sweep mode to the harness**

In `tools/extract-seeds/extract.ts`, after building `out`, add: split each class 80/20, then for `distanceGate ∈ {0.45,0.5,0.55,0.6,0.65}` and `tau ∈ {0.7,0.78,0.85}`, build `test` = held-out vectors (each as `{id, vec}`) plus cross-labelled wrong pairs, call `evaluate`, and `log` a table of `(gate, tau) → trueAccept / falseAccept`. (Import `evaluate` from `../../src/recognizer/calibration`.) Pick the gate/tau with the **highest trueAccept at falseAccept ≈ 0**.

- [ ] **Step 6: Apply tuned values**

In `src/recognizer/knn.ts`, set `DISTANCE_GATE`, `TAU`, `MARGIN_GATE` to the chosen values from the sweep. In `src/components/CameraTrainer.tsx`, change `const HOLD_FRAMES = 10;` to a value giving **>1s** at ~20fps (e.g. `24`). Add a comment recording the sweep result, e.g. `// calibrated 2026-06-24: gate=0.x tau=0.x → TA=0.xx FA=0.00 on AASL 80/20`.

- [ ] **Step 7: Record evidence in the spec follow-up**

Append the chosen thresholds and the trueAccept/falseAccept numbers to the spec file under a new `## Calibration result` heading (real numbers — this is the acceptance evidence that the "instant yes" is gone).

- [ ] **Step 8: Build, test, commit**

```bash
npm test && npm run build
git add src/recognizer/calibration.ts src/recognizer/calibration.test.ts src/recognizer/knn.ts src/components/CameraTrainer.tsx tools/extract-seeds/extract.ts docs/superpowers/specs/2026-06-24-sawiyya-honest-grading-onboarding-revamp-design.md
git commit -m "feat(recognizer): calibrate gates on held-out data; hold >1s (no insta-pass)"
```

---

### Task 5: First graded sign → Alif, and honest teach-mode copy

**Files:**
- Modify: `src/screens/FirstSign.tsx:74` (sign target)
- Modify: `src/components/CameraTrainer.tsx` (teach copy honesty via i18n)
- Modify: `src/i18n.ts` (return-relabel `camTeach`/`camTeachSub` to honest wording, both langs)

**Interfaces:**
- Consumes: `signById("alpha-alif")` from `src/content/signs.ts`; real seeds (Task 3) make it grade for real.

- [ ] **Step 1: Point the first sign at Alif**

In `src/screens/FirstSign.tsx`, change:
```ts
const sign = signById("iloveyou");
```
to:
```ts
const sign = signById("alpha-alif");
```
Update the comment block above it to say the first graded sign is the real-graded letter Alif (not the teach-mode word). The `referenceChip` in `CameraTrainer` already renders `sign.code` for alphabet signs, so Alif shows its glyph automatically.

- [ ] **Step 2: Make the teach-mode copy honest**

In `src/i18n.ts`, find the `camTeach` and `camTeachSub` strings and change them to honest framing (do not imply pre-grading), both languages:
- `camTeach` EN: `"Teach Sawiyya this sign"` / AR: `"علّم سويّة هذه الإشارة"`
- `camTeachSub` EN: `"Record it once, then practise it — this sign isn't pre-loaded yet."` / AR: `"سجّلها مرة، ثم تدرّب عليها — هذه الإشارة ليست محمّلة مسبقًا بعد."`

- [ ] **Step 3: Verify the flow in the app**

Run: `npm run dev`, complete onboarding to the first sign. Confirm: the camera opens on **Alif** (ا glyph in the reference chip), it does **not** ask you to teach it (grade mode, because seeds exist), and a wrong handshape does **not** confirm in under a second.
Expected: real grading behaviour; celebration only on a genuine Alif held >1s.

- [ ] **Step 4: Build and commit**

```bash
npm run build
git add src/screens/FirstSign.tsx src/i18n.ts src/components/CameraTrainer.tsx
git commit -m "feat(onboarding): first graded sign is real-graded Alif; honest teach-mode copy"
```

---

### Task 6: Clean, premium onboarding — strip AI art + emoji, honest badges

Replace AI-generated persona illustrations and emoji with a polished brand-glyph treatment, and make the "what to learn" badges honest.

**Files:**
- Modify: `src/screens/Onboarding.tsx`

- [ ] **Step 1: Replace persona art with brand glyphs**

In `src/screens/Onboarding.tsx`, change the `PERSONAS` array so each entry carries a Material Symbol `icon` instead of an `img`:
```ts
const PERSONAS: {
  value: Persona;
  icon: string;
  key: "obParent" | "obSibling" | "obTeacher" | "obFriend" | "obDeaf";
  ar: string;
}[] = [
  { value: "parent", icon: "family_restroom", key: "obParent", ar: "طفلي" },
  { value: "sibling", icon: "diversity_3", key: "obSibling", ar: "أخي أو أختي" },
  { value: "teacher", icon: "school", key: "obTeacher", ar: "طالبي" },
  { value: "friend", icon: "group", key: "obFriend", ar: "صديقي" },
  { value: "deaf", icon: "sign_language", key: "obDeaf", ar: "أنا أصم — أهيّئ عائلتي" },
];
```
Then in the `why` step, replace each `<img ... src={p.img} />` with a glyph in the existing rounded tile, e.g.:
```tsx
<Icon name={p.icon} fill className="!text-4xl text-teal" />
```
keeping the existing tile wrappers (the `h-24 w-24 ... rounded-2xl bg-sand/60` for standard cards, the gold tile for the deaf card) for a clean, consistent, premium look. Remove the `subKey` field and its usages if they were only feeding the old layout (leave the localized title `t(p.key, lang)` and the Arabic `p.ar`).

- [ ] **Step 2: Replace the 👋 emoji in the "learn" step**

In the `learn` step, the "Everyday signs" card uses a `👋` span. Replace it with a brand glyph tile:
```tsx
<span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gold/15">
  <Icon name="waving_hand" fill className="!text-2xl text-gold" />
</span>
```

- [ ] **Step 3: Make the badges honest**

In the `learn` step:
- Keep the **Arabic Alphabet** card's "Ready" badge and `check_circle` (now true — real seeds).
- For the **Everyday signs** card, replace the trailing `check_circle` icon with a small neutral pill reading `pick(lang, "Teach & practise", "علّم وتدرّب")` so it doesn't imply pre-grading.

- [ ] **Step 4: Verify visually**

Run: `npm run dev`, walk onboarding on a narrow (mobile) and wide (desktop) viewport. Confirm: no raster persona images, no emoji, glyphs are crisp and consistent, the deaf "Special Path" card still reads as premium gold, badges read honestly.
Expected: clean, cohesive, premium onboarding.

- [ ] **Step 5: Build and commit**

```bash
npm run build
git add src/screens/Onboarding.tsx
git commit -m "feat(onboarding): premium brand-glyph personas, no AI art/emoji, honest badges"
```

---

### Task 7: Landing page — lead with "together, as equals" + Deaf-can-use-it

**Files:**
- Modify: `~/Desktop/Projects/sawiyya-landing/index.html`

- [ ] **Step 1: Title + headline**

In `~/Desktop/Projects/sawiyya-landing/index.html`:
- Line 6 `<title>`: change `Learn to sign. Close the gap.` → `Learn to sign, together as equals.`
- Hero `<h1>` (line 351): change inner HTML from `Learn to sign.<br><span class="swap">Close the gap.</span>` to `Learn to sign —<br><span class="swap">together, as equals.</span>`, and its `data-ar` from `تعلّم لغة الإشارة.<br><span class='swap'>لنردم الفجوة.</span>` to `تعلّم لغة الإشارة —<br><span class='swap'>معاً، كأنداد.</span>`

- [ ] **Step 2: De-duplicate the tagline chip**

The hero tagline chip (line 352) currently reads `سويّة • Together, as equals`. To avoid saying it twice in the hero, change its English text to `Qatari Sign Language` and its `data-ar` Arabic portion to `لغة الإشارة القطرية` (keep the `سويّة` + gold bar markup; only swap the trailing label).

- [ ] **Step 3: Add the "Deaf people can use it too" block**

Near the two-way-street section (around lines 389–402), add a short bilingual block, matching the surrounding markup/classes, with copy to this effect (refine wording in place before committing):
- EN: "And it works both ways. Deaf users can navigate Sawiyya themselves and set it up for their family — choosing what the household learns. It puts the tools in Deaf hands too."
- AR (`data-ar`): "ويعمل في الاتجاهين. يمكن للأشخاص الصُمّ استخدام سويّة بأنفسهم وإعداده لعائلاتهم — واختيار ما تتعلّمه الأسرة. فهو يضع الأدوات بين أيدي الصُمّ أيضًا."

- [ ] **Step 4: Verify**

Open `~/Desktop/Projects/sawiyya-landing/index.html` in a browser; toggle EN/AR. Confirm: hero leads with "together, as equals" (EN + AR), the chip no longer repeats it, and the Deaf-can-use-it block renders correctly in both languages.

- [ ] **Step 5: Commit (landing repo)**

```bash
cd ~/Desktop/Projects/sawiyya-landing
git add index.html
git commit -m "copy: lead with 'together, as equals'; add Deaf-can-use-it section"
```

---

## Self-Review

**Spec coverage:**
- Part A (landing: tagline lead, de-dupe, Deaf-can-use-it) → **Task 7** ✓
- Part B.1 (strip AI art/emoji, premium treatment) → **Task 6** ✓ (cleaner-design bar folded in)
- Part B.2 (first graded sign = Alif) → **Task 5** ✓
- Part B.3 (honest badges) → **Task 6 Step 3** ✓
- Part C.1 (offline extraction via our normalize) → **Task 3** ✓
- Part C.2 (seeds as read-only base layer) → **Task 2** ✓
- Part C.3 (un-cheatable: hold >1s + re-tuned gates on held-out split) → **Task 4** ✓
- Part C.4 (words stay honest teach-mode) → **Task 5 Step 2** ✓
- Testing/verification (calibration evidence) → **Task 4 Steps 1–7** ✓

**Placeholder scan:** Landing copy and SOURCES.md wording are written out; the only "refine in place" is final landing prose, which is reviewed before commit (Task 7 Step 4) — acceptable, not a logic gap. No "TBD"/"handle edge cases"/"similar to Task N".

**Type consistency:** `__setSeedsForTest`, `classifyAgainst`, `sampleCount`, `isTrained`, `trainedClassIds` names match across Tasks 2/4. `evaluate(opts)` signature matches between `calibration.ts` and its test and the sweep harness. Seed JSON shape `{ [alphaId]: number[][] }` and 42-dim vectors are consistent across Tasks 2/3. `signById("alpha-alif")` id matches `src/content/signs.ts`.

---

## Calibration result

_(Filled in during Task 4 Step 7 with the chosen `DISTANCE_GATE` / `TAU` / `MARGIN_GATE`, `HOLD_FRAMES`, and measured trueAccept / falseAccept on the dataset split.)_
