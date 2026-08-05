---
date: 2026-08-05
branch: feat/phase-3-stages
status: in-progress
---

# Session handoff: Phase 3 built and gated; Melusi chose "review then merge all three"

## Resume protocol

1. Read this whole file
2. Run: `git status && git log --oneline -5`
3. Open: `docs/WHAT-CHANGED-phase-3-stages.md`, `src/journey/journey.ts:24`,
   `docs/ux-audit-2026-08-01/07-THE-PLAN.md:102`
4. Walk him through the three phases against `~/Desktop/sawiyya-phase-{1,2,3}-shots/`, then merge
   `fix/phase-1-one-road` → `feat/phase-2-one-first-run` → `feat/phase-3-stages` into `main` and
   confirm the LIVE app changed.

> **Scope note:** all work was in-repo and is committed. Working tree is clean.
> **Variant:** Feature.
>
> **Nothing is pushed and nothing is deployed.** `.github/workflows/deploy.yml` fires on push to
> `main`, so **merging IS deploying**. `main` is still at `cc99ce3`. Three branches are stacked:
> `fix/phase-1-one-road` (`c8b8d66`), `feat/phase-2-one-first-run` (`9ab4347`),
> `feat/phase-3-stages` (`68b85d2`).

## Task state

**What we were doing:** Resumed from the Phase 2 handoff, asked Melusi "merge or build Phase 3", he
chose build. Phase 3 "Stages" is now built, tested, gated and committed. He was then asked what
next, chose **"Review, then merge all 3"**, and interrupted to run `/custom-compact` before any of it
started.

**Exact next step:** Nothing is half-done. Start the review he asked for: walk him through what
changed in each phase, pointing at specific files in `~/Desktop/sawiyya-phase-1-shots/` (49),
`~/Desktop/sawiyya-phase-2-shots/` (51) and `~/Desktop/sawiyya-phase-3-shots/` (51), using the three
`docs/WHAT-CHANGED-phase-*.md` notes as the script. Then merge the three branches into `main` in
stack order and verify the live app actually changed, not just that the push succeeded.

**Open questions:**
- **The 19 A1 word signs are `cameraGradable: false`** — watchable, never practisable, no
  real-signer footage. Oldest open question in the project, now five sessions old. Phase 4 touches
  the Words screen directly (it merges Words into Signs), so this starts blocking real work.
- **The mascot** — Fanan is rejected with no replacement chosen, still on three setup screens and
  beside the current lesson node. He asked to be reminded; he was, and did not act.
- **The dictionary padlock may be theatre** — free camera practice on all 28 letters is one tab away
  on Practise, so a padlocked dictionary letter is still reachable. Raised in Phase 1, unanswered.
- **Is Sawiyya a real product or the Mada demo?** Asked across five sessions, never answered.

**Blockers:** None for the merge. Phase 4 is fully specified and unblocked by all of the above.

## Reasoning trail

**Decisions made:**
- **The plan's positional backfill was replaced with per-step `entails`.** Point 5 of the plan says
  completing a later milestone marks the earlier ones done. Taken literally, tapping "ask for a sign"
  in minute one ticks first-sign, first-lesson, install and first-review for someone who did none of
  them. Each step now lists what it genuinely proves. The wedge the plan feared is prevented instead
  by making every step that proves nothing `dismissible`.
- **`firstOpenAt` was deliberately NOT added.** It is `metrics.appFirstOpenAt`, already normalized
  and persisted. Two fields for one fact is the collision Phase 4 exists to clean up.
- **The ladder is called STEPS, not MILESTONES.** `src/lesson/milestones.ts` already owns that noun
  for the mastery ladder Home's chest and Progress's "Next milestone" both read. The plan itself
  uses both names in the same breath (point 1 vs point 4).
- **The full ladder lives on Progress; Home gets at most ONE row, and only when `onTrail` is false.**
  Phase 1 deleted Home's card stack for offering nine answers to "what do I do now"; a strip
  repeating the trail's answer would restore the first of them. So Home only ever shows install,
  review and the family flag.
- **`install` is observed, never inferred** — off `display-mode: standalone` / `navigator.standalone`
  at boot, and never swept up by a backfill. Android gets the real `beforeinstallprompt`; iOS Safari
  has no API at all, so it gets written steps instead of a dead button.
- **A pre-Phase-3 blob backfills the ladder from evidence the app already recorded** (camera
  attempts, lessons completed, an SRS card with `reps >= 2`, an existing flag, a finished unit), or
  a learner with half the alphabet is told to go and sign their first letter. Their `seen` map stays
  empty on purpose — they are not new, so a future announcement should still reach them.
- **The `beforeinstallprompt` listener registers at module import time**, not when the sheet opens.
  The event fires early; a listener added on open has already missed it.

**Tried and rejected:**
- **Putting the whole ladder on Home.** Direct conflict with Phase 1's one-road rule. Progress got
  the readout instead — but note Progress is nearly unreachable today (Phase 4 point 2 exists to
  give it a door), which is exactly why Home keeps the single non-trail row.
- **Asserting the family-board hint inside the existing Phase 1 family step.** When it failed on the
  parent build it aborted that step before the flagging, which reported a Phase 1 regression that had
  not happened. Split into its own step placed BEFORE the Phase 1 gate.
- **A smoke assertion that no hint fires on a cold-loaded Progress screen.** By that point in the run
  cards are due, so the Coming Up panel is not empty and there is no eligible hint — the assertion
  was vacuous. The "never on the launch screen" rule is exercised properly in
  `src/journey/hints.test.ts`, which can reset the module budget a browser cannot.
- **Shipping `ANNOUNCEMENTS` non-empty to make `coldStartSeen` do visible work.** Inventing a feature
  to justify machinery. It ships empty with the reason written down: the cold-start rule cannot be
  retrofitted for learners who onboard before the first announcement exists.

## Code anchors

- `src/journey/journey.ts:24` — the `JourneyStep` interface. `entails`, `dismissible`, `onTrail` and
  `needs` are the whole design; every rendering decision reads off those four fields.
- `src/journey/journey.ts:170` — `stepsImpliedBy`, the transitive closure that replaced the plan's
  positional backfill.
- `src/journey/hints.ts:16` — the module-level session budget (`spent`, `navigations`). Deliberately
  not persisted: "one per session" means one per app open.
- `src/components/Journey.tsx` — `JourneyStrip` (Home, one row), `JourneyLadder` (Progress, all six),
  `InstallSheet`, `HintNote`, `useInstallDetection`.
- `src/store/app.ts:395` — `normalizeJourney`, including the evidence backfill for pre-Phase-3 blobs.
- `src/store/app.ts:133` — `withStep` / `anyUnitFinished`, the detection helpers wired into
  `recordDrillResult`, `recordLessonComplete` and `toggleFlag`.
- `scripts/smoke.mjs` — 32 steps, 6 new. Two pre-existing harness faults fixed here: the lesson loop
  stopped at the part-done card so no lesson ever completed, and "lesson end card → home" knew only
  one of that card's two labels ("Back home" vs "Continue").
- `docs/ux-audit-2026-08-01/07-THE-PLAN.md:102` — Phase 4 "Say what things are", the next build.

## Verification run this session

- `npx tsc -b` clean · `npx vitest run` **214 passed, 22 files** (was 162/19; +52 tests in
  `journey.test.ts`, `hints.test.ts`, `store/journey.test.ts`) · `npm run build` green ·
  `node scripts/smoke.mjs` **32/32**, no unexpected console errors · `npm run shots` 51 shots, clean
  console on every screen.
- **The six new gates were re-run against `9ab4347`** via `git worktree add --detach`, symlinked
  `node_modules`, `npx vite build`, `python3 -m http.server`. Every one fails there; every Phase 1
  and Phase 2 step still passes. Worktree removed.
- Serving a build: `cd dist && python3 -m http.server 4173`, then `SMOKE_URL=http://localhost:4173/
  node scripts/smoke.mjs`. `vite preview` still serves nothing from an outside-root outDir.

## Git state snapshot

**Branch:** `feat/phase-3-stages`

**Status:**
```
(clean)
```

**Recent commits:**
```
68b85d2 feat(journey): Phase 3 — stages
bed9703 docs: the Phase 2 session handoff, left untracked last session
9ab4347 feat(onboarding): Phase 2 — one first run
c8b8d66 fix(smoke): close Phase 1's gate — the four failing steps were the harness
62c8e5a fix(home): Phase 1 — one road
72abafe docs: the UX journey audit and the four-phase plan
cc99ce3 test(camera): make the 0% grading failure impossible to ship again
2e02496 fix(camera): the mirror trigger was inverted — every letter graded 0%, always
52492df Merge: the coherence pass — 130 defects in the seams between screens
0518894 fix(shots): the screenshot harness was broken by the coherence pass
```

**Diff stat:**
```
(no unstaged changes)
```
