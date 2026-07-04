# Sawiyya Overhaul — Opus 4.8 Execution Plan

> **How to run this:** open a NEW Claude Code session in `~/Documents/GitHub/sawiyya`, switch model to Opus 4.8 (`/model opus`, or launch with `claude --model claude-opus-4-8`), and work through the steps below **one step per prompt** ("Do Step 0 of docs/OPUS-EXECUTION-PLAN.md", then "Do Step 1", …). One step at a time keeps context small and quality high. Do not try to do the whole file in one prompt.

## Where things stand (verified 2026-07-02)

- **Branch:** `feat/fable5-overhaul` (app repo `theshumba/sawiyya`). NOT merged, NOT pushed. `main` is untouched and still what's deployed live.
- **Audit:** `docs/AUDIT-2026-07.md` = the source of truth. 108 findings with IDs (C=critical, H=high, M=medium, L=low), evidence, and recommended fixes. Read the relevant findings before every step.
- **DONE and committed (but see Step 0):** Batches 1–3 — 22 app commits + 3 commits in the landing repo (`~/Desktop/Projects/sawiyya-landing`, its `main`, not pushed):
  - **Batch 1 Truth pass:** C1 Mada badge → honest "2026 entry"; C2 AI 'signer' photo retired; C3 ASL provenance disclosed everywhere; C4/C5 landing fabrications removed; C6 Progress shows only real data; H14 no emoji-as-sign; M9, M10, M30, L6.
  - **Batch 2 Deploy & state safety:** H11 vitest gate in deploy.yml; H12 error boundaries; H13 persist version+migrate+corrupt-blob backup; H9 precache 14MB→1.8MB; M12 dist/ untracked; M21, M23, L4, L10, L16.
  - **Batch 3 Funnel:** H18 PostHog token fixed (landing only — app stays analytics-free); H19 real notify-me capture; H20 honest reminders + trimmed onboarding + autoStart; M26 read-time streak; M27 `?lang=ar` handoff both sides; M28 FirstSign watch phase restored.
- **Verified green at handoff:** `npx tsc --noEmit` clean · `npx vitest run` 43/43 · `npm run build` succeeds.
- **NOT done:** Batches 4–8 (below), the adversarial review of batches 1–3, final gate, merge, deploy.

## Non-negotiables (apply to every step)

1. **Never fabricate** signs, testimonials, approvals, awards, stats, or people. Honest replacements only: real data, honest empty states, or explicit "Phase 2 / coming with our Deaf signer partner" labels.
2. **On-device only.** No analytics in the app (landing PostHog is fine). Keep OnDeviceBadge truthful.
3. **Engine thresholds** (tau, gates, hold frames) are calibrated — do not change without re-running `tools/extract-seeds/` calibration and reporting before/after TA/FA.
4. **No AASL dataset** (license disputed, NC). Zenodo ArSL + ArSL21L (CC-BY-4.0) are fine.
5. **Bilingual parity:** every new user-facing string ships EN + AR, RTL-correct. Append every new AR string to `docs/ARABIC-PROOFREAD.md`.
6. **Design system:** dc.tsx primitives + tailwind tokens + DESIGN-SYSTEM.md. No one-off styles. No emoji as content.
7. **Verification before every commit batch:** `npx tsc --noEmit` && `npx vitest run` && `npm run build` all green. Atomic conventional commits.
8. **Never push** until the final Step 7 says so. Never commit dist/ or tsconfig.tsbuildinfo.
9. **OWNER-GATED (leave for Melusi, just note in runbook):** live phone camera test (`?debug`), native-signer recording, AASL clearance, Mada submission, DNS, native Arabic proofread.

## Step 0 — Review the unreviewed work (do FIRST)

Batches 1–3 were built but never reviewed. Run `git log --oneline main..feat/fable5-overhaul` and `git diff 7059425..HEAD`, plus the 3 newest commits in `~/Desktop/Projects/sawiyya-landing`. Check each claimed finding ID against `docs/AUDIT-2026-07.md`: actually fixed? honest copy? EN+AR parity? any regression? Fix what's wrong, commit fixes. Spot-check the app in `npm run dev` (onboarding, Home, Progress, a camera screen — expect no console errors).

## Step 1 — Batch 4: Core loop repair (the heart — do carefully)

Findings: **H1** Lesson-1 routing deadlock (LessonPlayer unreachable, quizzes + 12/16 word signs dead code) · **H2** SRS never receives a failure rating (wire camera fail/timeout → Again/Hard per audit) · **H3** review queue floods after a break and is unclearable (daily cap + spread) · **M3** watch drills auto-rated "good" · **M4** mastery farmable via watch-only repeats · **M5** queue starvation by day 10 (inject new content) · **L5** skip semantics · **M11** (store/SRS half) add store + SRS tests.
**Prove it:** add a deterministic multi-day simulation test to vitest — a simulated 14-day learner converges on the alphabet; queue never floods beyond the cap or starves while content remains. Touches: store, Home, PractiseChooser, LessonPlayer, FirstSign routing — read them fully first.

## Step 2 — Batch 5: Family Mode made real (differentiator #1)

Findings: **H4** flags seed nobody's queue → flagged signs must enter each hearing member's SRS/practice queue · **H5** flagged signs deep-link to Alif instead of their own target · **H6** a Deaf member must be excludable from streak/leaderboard pressure (they're the assigner) · **H7** flag ownership unenforced · **H8** single-device, no export → local-first JSON export/import + plain "data lives on this device" disclosure · **M8** assigner sees per-member progress on the flagged set · **L7** flag cap + dead householdName · **M11** (family half) family store tests. Design the data shape so a future backend slots in without migration pain.

## Step 3 — Batch 6: Alphabet curriculum + fingerspelling (differentiator #2)

Findings: **H22** content ceiling — build the 28 letters into letter-group units (4–6 groups) with mixed drills: recognise-the-sign quizzes (HandSkeleton shown, pick the letter — pool only from letters the user has met) + produce-the-sign camera drills + checkpoints · **M6** NEW fingerspelling mode: type an Arabic word → letter-by-letter HandSkeleton playback, adjustable speed, practice-along camera for gradable letters, entry from Home/PractiseChooser, bilingual · **H23** Sign.media wiring per audit so owner-gated footage is drop-in · **M7** yes/no static-motion contradiction. Respect `cameraGradable` gates everywhere.

## Step 4 — Batch 7: Engine hardening

Findings: **H10** self-host MediaPipe wasm/.task (pin exact version from package.json, vendor into public/, SW-precache; verify built bundle has zero CDN refs) · **M1** additive out-of-distribution rejection gate on the MLP (calibrated thresholds untouched; document rationale) · **M2** teach-blend silent pass disclosure · **H17** mirror-handling unit test (live phone check stays owner-gated) · **M13** code-split the 869KB chunk (lazy-load seeds/model JSON) · **L1, L2, L3**. Do NOT retrain anything.

## Step 5 — Batch 8: A11y & polish

Findings: **H15** AA contrast on flagged token pairings (adjust tailwind tokens, keep brand hues, record before/after ratios) · **H16** focus management on screen transitions · **H21** camera-less demo path — camera denied/absent must still show value (watch + skeleton + honest "camera practice unavailable" label; NOT fake grading) · **M14–M20** iOS/viewport/landmarks/RTL/screen-reader/Arabic fixes · **M22** multi-tab per audit recommendation · **M24** dead i18n keys · **M25** consolidate ui.tsx vs dc.tsx · **L8–L19** debris · finish `docs/ARABIC-PROOFREAD.md` as the complete owner handoff list.

## Step 6 — Final gate

Fresh full run: tsc, vitest, build. Then Playwright smoke against `vite preview`: cold onboarding → first sign → Home → all tabs → fingerspelling → family flag flow → settings, in EN **and** AR (RTL), plus camera-denied path — no dead ends, no console errors. Bundle checks: no MediaPipe CDN refs, no analytics in app bundle, no "Winner"/testimonial strings anywhere, precache size sane. `git log main..HEAD` contains no dist/node_modules/secrets.

## Pinned design decisions (do NOT redesign — implement exactly these)

These resolve every judgment call left open by the audit. If the code makes one of these impossible as written, pick the nearest faithful variant and record the deviation in your commit message — do not invent a different design.

### Step 1 (Batch 4) — ratings, queue, mastery
- **Soft fail:** in camera drills, if no confirmed match after **20 seconds of hand-visible time**, show "Still tricky — let's see it again" (EN+AR) → replay the HandSkeleton demo → rate the card **'again'**. User retries immediately. Never a blocking fail screen (never-hard-fail brand rule).
- **Self-mark** ("I did it" without camera confirmation) → rate **'hard'**, never 'good'.
- **Skip** = record **nothing** (no-op) in both LessonPlayer and CameraPractice (resolves L5).
- **Watch drills:** never call rateCard; watch reps never count toward mastery (M3).
- **Review sessions:** wire review CTAs to the existing `lessonId:'review'` queue; sessions of **10 cards**, oldest-due first, mixed drill types; **daily soft cap 30 reviews** — beyond that show "30 done today — the rest will wait for tomorrow" (EN+AR). This is the flood spreader (H3).
- **Starvation (M5):** when nothing is due and the daily goal is unmet, Home offers "Learn a new letter" = the next letter in curriculum order (see Step 3 groups) that has no SRS card.
- **Mastery level 3** requires: FSRS card state = Review **and** stability ≥ 2 days **and** ≥ 2 camera-confirmed successes (self-marks and watch don't count) (M4).
- **Milestone at:16** filters to A1_SIGNS ids only (M4).

### Step 2 (Batch 5) — Family Mode semantics
- **Flag shape:** add `raisedBy: profileId` and `supporters: profileId[]` to Flag. On creation, seed `newStoredCard()` into every **non-raiser** profile's SRS (H4).
- **Ownership (H7):** only the raiser or any deaf-role profile can deactivate a flag. Another member tapping an already-flagged sign is a **co-request** (added to `supporters`), never a toggle-off. "Clear all" clears only the current profile's own raised flags.
- **Routing (H5):** flagged sign taps → camera only when `cameraGradable`; otherwise the dictionary/watch surface for that exact sign.
- **Deaf-role (H6):** excluded from the honeycomb intersection denominator and household-streak day-sets; their **flagging activity counts as their active day**.
- **Assigner visibility (M8):** each flag row shows one mastery dot (0–3) per non-raiser member; when all non-raiser hearing members reach mastery ≥ 2, the flag **auto-archives** (kept in state as `archived`, not deleted) and the sign celebrates into the honeycomb.
- **Export/Import (H8):** Settings gains "Export household" (JSON file download) and "Import household" (file picker). Format: `{ schema: "sawiyya.household.v1", exportedAt, appVersion, state: <entire persisted app-store slice> }`. Import validates the schema tag, shows a bilingual "this replaces everything on this device" confirm, then replaces wholesale. One honest line on the Family screen: data lives on this device — export to move it.

### Step 3 (Batch 6) — curriculum + fingerspelling
- **Letter groups — 4 lessons of 7, standard Arabic order** (predictable, defensible; do NOT invent a similarity-based order without data):
  1. ا ب ت ث ج ح خ · 2. د ذ ر ز س ش ص · 3. ض ط ظ ع غ ف ق · 4. ك ل م ن ه و ي
  Each lesson: per letter watch (HandSkeleton) → produce (camera drill); end-of-group checkpoint = recognise quiz (show a skeleton, pick the letter) drawn only from letters met so far. 28-letter milestone at the end.
- **Fingerspelling "Spell your name" (M6):** Arabic text input only. Map each char to its `alpha-*` sign; ة renders its reference-only card (not gradable); non-letter chars are skipped with a small honest note. Playback = HandSkeleton sequence at 0.5× / 1× / 2×. Then optional "practice along": camera steps through the word's gradable letters one by one. Entry points: Home card + PractiseChooser.
- **Sign.media (H23):** optional `media?: { type: 'video'; src: string; poster?: string }` on the Sign type; SignDemo renders the video when present, current fallback otherwise; recognise-quiz pools filtered to signs with a real visual (skeleton or media). Footage itself stays owner-gated.
- **yes/no (M7):** flip both to dynamic + `cameraGradable:false` (the audit's first option — safest honest choice). iloveyou + stop stay gradable.

### Cross-step rule
After finishing each step, run the batch's **verification gate exactly as written in docs/AUDIT-2026-07.md §"Prioritised execution plan"** — the gates there are the acceptance criteria for these steps (Step 1↔Batch 4, Step 2↔Batch 5, Step 3↔Batch 6, Step 4↔Batch 7, Step 5↔Batch 8).

## Step 7 — Merge + deploy (only if Step 6 fully passes)

`git checkout main && git merge feat/fable5-overhaul && git push` → watch the GitHub Actions Pages run → verify https://theshumba.github.io/sawiyya live bundle contains the new markers and none of the fabricated strings. Push the landing repo (`~/Desktop/Projects/sawiyya-landing`, main) → verify https://sawiyya.com. Then write the owner runbook summary: phone camera test with `?debug`, Arabic proofread list location, native-signer next step, ArSL21L download step.
