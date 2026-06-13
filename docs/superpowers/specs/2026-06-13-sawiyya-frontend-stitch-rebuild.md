# Sawiyya — Frontend rebuild to Google Stitch v2 (AAA)

**Date:** 2026-06-13
**Branch:** `stitch-frontend-rebuild`
**Goal:** Rebuild the entire frontend so every screen faithfully matches the new
Google Stitch v2 branded designs, while keeping 100% of the existing backend /
under-the-hood logic untouched. Mobile-first PWA, desktop-responsive. Quality bar: AAA.

---

## 1. Hard rules (every agent must obey)

### FROZEN — read-only, never modify
These directories/files are the "backend / under-the-hood" the user wants preserved:
- `src/store/app.ts` (app state, profiles, onboarding, streaks)
- `src/store/srs.ts` (spaced repetition / ts-fsrs)
- `src/recognizer/*` (MediaPipe hand-tracking, KNN, normalize)
- `src/lesson/*` (lesson engine, milestones)
- `src/content/*` (signs.ts — the sign data + ALPHABET/A1_SIGNS/ALL_SIGNS)
- `src/i18n.ts` (EN/AR strings + RTL)
- `src/types.ts`

Agents may **import from** these freely, but must not change a single line.
A diff touching any frozen file = a defect.

### EDITABLE
- `src/store/ui.ts` — the screen router (only to ADD routes; do not break existing ones)
- `src/App.tsx` — screen wiring
- `src/screens/*` — the screens (this is the bulk of the work)
- `src/components/*` — shared presentational components
- `src/styles.css`, `tailwind.config.js`, `index.html` — only in the wiring pass (Phase 0)

### Design-token vocabulary (already in `tailwind.config.js` — USE THESE, do not invent new)
- Colours: `teal` (`#0F6E6A`, `.deep` `#0A4F4C`, `.ink`), `coral` (`#E8654C`, `.soft`),
  `gold` (`#E6B24C`, `.soft`), `sand` (`#F6EFE3`), `paper` (`#FBF7EF`), `ink` (`#16302E`),
  `muted` (`#5C726F`), `line` (`#EDE3D2`).
- Fonts: `font-sans` = Readex Pro (body/UI, dual-script), `font-display` = Rubik (headings/numbers).
- Radii: `rounded-xl/2xl/3xl/bowl`. Shadows: `shadow-soft/lift/gold/coral`.
- Buttons: reuse `Button` from `src/components/ui.tsx` (extruded "pressable" variants:
  `primary` coral, `secondary` teal, `gold`, `ghost`). Extruded depth utilities live in `styles.css`.
- Animations: `animate-pop-in / rise / pulse-ring / shimmer`.

The raw Stitch HTML files declare a token block using `primary`. Do **not** copy that naming —
map `primary → teal`. Our config is the source of truth; the Stitch HTML is the visual target.

### Fidelity
- Match the Stitch chrome (layout, spacing, colour, type, illustrations, copy) faithfully.
- **Live regions stay wired to real logic**, styled to match the mockup:
  camera feed (`useHandTracker`/`CameraTrainer`), live recognizer confidence, real
  lesson/SRS/profile data from the stores. Never hardcode the mock data shown in a PNG.
- Mobile-first; apply the desktop Stitch layout at `md:` breakpoints.
- Preserve accessibility: focus-visible rings, reduced-motion, AA contrast, RTL (Arabic).
- Keep i18n: all user-facing copy via `t(key, lang)` — add no hardcoded English where an
  i18n key exists. If the Stitch copy needs a new string, the screen may use a literal only
  if no key exists AND it documents it; prefer existing keys.

---

## 2. Reference material
- Full-screen visual targets (PNG): `design/stitch-v2-brand/*.png` (mobile + desktop variants)
- Stitch source markup (HTML/Tailwind): `design/stitch-v2-brand/html/*.html`
- In-app illustration assets already bundled: `public/brand/stitch-NN.png` (referenced as
  `/brand/stitch-NN.png` at runtime). `public/brand/mapping.tsv` maps each to its origin.

---

## 3. Routing model
No react-router. `src/store/ui.ts` exposes `useUi()` with `screen` + `go(screen)`.
`App.tsx` switch-renders on `screen.name`. `BottomNav` shows on `home/camera/family/progress`.
Onboarding renders when `!app.onboarded`.

**New route to add (Phase 0):** `{ name: "allSigns" }` for the Library / Practise-the-alphabet
+ All-signs screens (no dedicated screen exists today; alphabet data lives in `content/signs.ts`).

---

## 4. Work breakdown

### Phase 0 — Wiring (1 agent, runs first, owns shared files)
Owns: `src/store/ui.ts`, `src/App.tsx`, `src/components/BottomNav.tsx`, `index.html`,
and creates a **build-clean stub** `src/screens/AllSigns.tsx` (real but minimal — Phase 1 fills it in).
- Add `allSigns` to the `Screen` union; wire into `App.tsx`.
- Rebuild `BottomNav` to the Stitch nav (tabs incl. a Library/Practise entry routing to `allSigns`).
- Confirm fonts/material-symbols in `index.html` (already present — verify only).
- Leave the app building green with the AllSigns stub.

### Phase 1 — Screen swarm (parallel, disjoint file ownership)
Each agent owns exactly the files listed, reads its Stitch HTML + PNG, and rebuilds to match.

| Agent | Owns | Stitch refs (in design/stitch-v2-brand/) |
|---|---|---|
| onboarding | `screens/Onboarding.tsx` | onboarding-who-are-you-learning-for--{mobile,desktop} |
| home | `screens/Home.tsx` | the-journey-home--*, sawiyya-together-as-equals--* |
| firstSign | `screens/FirstSign.tsx`, `components/SignDemo.tsx` | first-sign-watch-demo--*, first-sign-watch-i-love-you--mobile, celebration-connection-made--* |
| lesson | `screens/LessonPlayer.tsx` | lesson-choice-drill--mobile, lesson-drill-what-does-this-sign-mean--desktop, lesson-camera-practice--mobile, lesson-complete-results--* |
| camera | `screens/CameraPractice.tsx`, `components/CameraTrainer.tsx` | camera-drill-i-love-you--desktop, lesson-camera-practice--mobile |
| allSigns | `screens/AllSigns.tsx` | practise-the-alphabet--*, all-signs--* |
| flagPicker | `screens/FlagPicker.tsx` | flag-signs-we-need--* |
| family | `screens/Family.tsx` | family-our-majlis--desktop, our-majlis-family-space--mobile |
| progress | `screens/Progress.tsx`, `components/Confetti.tsx` | the-world-you-re-building-progress--desktop, progress-the-world-you-re-building--mobile, 4-day-streak-celebration--* |
| settings | `screens/Settings.tsx` | settings--* |
| info | `screens/InfoPages.tsx` | privacy--*, how-the-ai-works--* |

Screen agents: **do not** edit shared files (`ui.tsx`, `tailwind.config.js`, `styles.css`,
`index.html`, `App.tsx`, `store/ui.ts`) or any FROZEN file. If a primitive is missing, build it
locally inside your own screen/component file. Do not run a full `tsc -b` (siblings may be mid-edit);
just keep your own file type-correct against the existing imports.

### Phase 2 — Integration & verification (1 agent, last)
- `npm run build` must pass clean.
- `git diff --name-only ebd4a96..HEAD` (or against the checkpoint) must show **zero** FROZEN files.
- Start `npm run dev` and run `node scripts/shots.mjs`; confirm the flow runs without crashing and
  capture `/tmp/sawiyya-shots/*`. Report any screen that errors or visibly diverges from its Stitch ref.
- Produce a punch list of remaining gaps for an orchestrator fix-round.

---

## 5. Success criteria
1. Every Stitch v2 screen has a working, faithful in-app counterpart, reachable via real navigation.
2. `npm run build` green; no TypeScript errors.
3. No FROZEN file modified.
4. Mobile-first + desktop-responsive; RTL + a11y + reduced-motion preserved.
5. Live features (camera, recognizer, lessons, SRS, family, progress) remain fully functional.
6. Screenshot harness runs end-to-end without crashing.
