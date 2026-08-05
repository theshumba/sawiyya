---
date: 2026-08-05
branch: feat/phase-2-one-first-run
status: in-progress
---

# Session handoff: Sawiyya Phases 1 and 2 both built and gated, both unmerged

## Resume protocol

1. Read this whole file
2. Run: `git status && git log --oneline -5`
3. Open: `docs/WHAT-CHANGED-phase-2-one-first-run.md`, `docs/ux-audit-2026-08-01/07-THE-PLAN.md:73`,
   `src/screens/Onboarding.tsx:212`
4. Ask Melusi: "Merge Phases 1 and 2, or build Phase 3?"

> **Scope note:** all work was in-repo and is committed. Working tree is clean.
> **Variant:** Feature.
>
> **Nothing is pushed and nothing is deployed.** `.github/workflows/deploy.yml` fires on push to
> `main`, so merging IS deploying. Two branches are stacked and both are waiting on his eyes:
> `fix/phase-1-one-road` (`62c8e5a`, `c8b8d66`) and `feat/phase-2-one-first-run` (`9ab4347`).

## Task state

**What we were doing:** Two things, in order. First, closing Phase 1's verification gate, which the
previous session had left with four failing smoke steps. Then he chose "Start Phase 2 now" over
reviewing Phase 1 first, so Phase 2 "one first run" was built and gated on a stacked branch.

**Exact next step:** Nothing is half-done. The next build is Phase 3 "Stages"
(`docs/ux-audit-2026-08-01/07-THE-PLAN.md:73`): one persisted slice in the Zustand store
(`milestones`, `seen`, `dismissed`, `firstOpenAt`), two ordered const arrays where array order is
the priority, stage derived and never stored, and hints in empty states rather than a tour. Roughly
120 lines, no new dependency. It is unblocked by every open question below.

**Open questions:**
- **The 19 A1 word signs are `cameraGradable: false`** — watchable, never practisable, no
  real-signer footage. Phase 2 deleted the route that pretended they were a track but did not solve
  them. Now the oldest open question in the project. Either shrink the promise to an honest Arabic
  fingerspelling trainer, or record a Deaf QSL signer.
- **The dictionary padlock may be theatre** — free camera practice on all 28 letters stays open one
  tab away on Practise, so a padlocked dictionary letter is still reachable. Drop the lock or keep
  it as a curriculum signpost. Raised in Phase 1, unanswered.
- **The mascot** — Fanan is rejected with no replacement chosen, and is still on three setup screens
  and beside the current lesson node. He asked to be reminded.
- **Is Sawiyya a real product or the Mada demo?** Asked across four sessions, never answered. The
  plan assumes real product and says so at its top for him to veto.

**Blockers:** None. Phase 3 does not depend on any of the above.

## Reasoning trail

**Decisions made:**
- **All four Phase 1 smoke failures were harness faults, not app faults** — each surface was
  verified working by hand in the same run. The first sign is Alif not "I love you" (Phase 1 put the
  alphabet at the head of `LESSONS`); the locked deep-link step failed on its SECOND wait because
  the current lesson opens on a camera drill, not a watch card; "Add a family member" survives only
  as an accessible name because the 74px tile truncates it to "Add"; and the Milk tile was never on
  screen because Milk is in the Food group while the picker opens on Home.
- **One Phase 1 assertion was passing when it should not have been.** "The flag lands ABOVE the
  trail" compared a case-sensitive string against `innerText`, which reports CSS-**uppercased** text.
  `indexOf` returned -1, which is less than everything, so the assert held wherever the card sat.
  **The same uppercase trap bit again in Phase 2** on the "Directs learning" badge check. Assume it
  will recur: compare lowercased whenever an assertion touches an eyebrow, badge, or chip.
- **A green harness on this repo means nothing until proven against the previous build.** Done for
  both phases via `git worktree add --detach <scratch> <sha>`, symlink `node_modules`, `npx vite
  build`, serve, run. Every Phase 1 check failed on `72abafe` and every Phase 2 check failed on
  `c8b8d66`, while the steps that are not phase gates still passed.
- **Phase 2's three questions replace the branching, they do not add to it.** The daily goal folded
  onto the days screen because both answer the same commitment question, so the run gained a
  question and a recap without getting longer (9 steps → 10).
- **The camera explainer became the TERMINAL step**, after the name, because it must be read
  immediately before FirstSign triggers the browser permission prompt. `finish()` now lives on that
  step's CTA, and the name step calls `advance()` instead.
- **Empty `practiseDays` means "not answered", never "every day".** Home stays silent rather than
  claiming a schedule the learner never agreed to. Old blobs backfill to empty for the same reason.
- **Three untrue strings were removed as part of the phase, not as scope creep** — the persona
  promise the plan named, the Deaf option's "SPECIAL PATH" badge (no path is special now; the role
  really carries directing the curriculum, which Family and FlagPicker already say), and the
  reminder preview that said "Every day" while the .ics it wrote said otherwise.
- **Fixed a plural bug found by instrumentation, not by looking** — the card Phase 1 promoted to the
  top of Home read "1 family requests". Pinned by the smoke step that stands on that screen with
  exactly one flag.

**Tried and rejected:**
- **A second throwaway script to verify the singular renders.** The smoke test already stands on
  that exact screen with exactly one flag, so the assertion belongs there. The standalone script was
  also flaky and was deleted.
- **Seeding `localStorage` so the shots harness could still capture the words lesson.** Phase 1's
  lock makes `#/lesson/a1-u1-l1` unreachable for a fresh learner, so that shot became a padlock
  captioned as the words lesson. Adding seed hooks to production code for a screenshot was not worth
  it, and the drill chrome is already covered by `en-lesson-alphabet`. Renamed to
  `en-lesson-locked` instead.
- **Deleting `obWhoSub` outright**, as the plan literally said. Removing it leaves the persona
  question a bare heading, so it was replaced with a line that is provably true of what the app
  does. First replacement ("your family will see it") was itself unverified and was rewritten before
  shipping.

## Code anchors

- `src/screens/Onboarding.tsx:45` and `:212` — the `Step` union and `STEP_ORDER`. The whole new
  sequence reads off these two; everything else in the file hangs on them.
- `src/screens/Home.tsx:162` — `practiseLine`, the practise-days answer written back onto the
  greeting. Returns null when unanswered or when every day was picked.
- `src/store/app.ts:271-276` — the `priorSigning` / `practiseDays` backfill in `normalizePersisted`.
  Range-checks, de-duplicates and integer-filters a hand-edited `practiseDays`.
- `scripts/smoke.mjs:70` — the Phase 2 block. 25 steps total, 6 new. `TODAY_LABEL` near the top
  makes the days assertion deterministic whatever day the harness runs on.
- `src/lesson/unlock.ts` — Phase 1's entire lock, unchanged this session. Position on an ordered
  path, never a per-lesson check on its own signs.
- `docs/ux-audit-2026-08-01/07-THE-PLAN.md:73` and `:102` — Phases 3 and 4, the next work.
- `docs/WHAT-CHANGED-phase-1-one-road.md` and `docs/WHAT-CHANGED-phase-2-one-first-run.md` — the
  plain-language notes he reads before deciding on a merge.
- `~/Desktop/sawiyya-phase-1-shots/` (49) and `~/Desktop/sawiyya-phase-2-shots/` (51) — 390px
  screenshots in both languages.

## Verification run this session

- `npx tsc -b` clean · `npx vitest run` 162 passed, 19 files (4 new store tests) · `npm run build`
  green · `node scripts/smoke.mjs` 25/25 with no unexpected console errors · `npm run shots` 51
  shots, clean console on every screen.
- Both harness runs repeated against the prior commit to prove the checks detect the change.
- The reminder `.ics` was downloaded and read rather than inferred from the code:
  `RRULE:FREQ=WEEKLY;BYDAY=MO,TH` after picking Monday and Thursday.
- Serving a build: `cd dist && python3 -m http.server 4173`. `vite preview --outDir <absolute path
  outside root>` serves nothing.

## Git state snapshot

**Branch:** `feat/phase-2-one-first-run`

**Status:**
```
(clean)
```

**Recent commits:**
```
9ab4347 feat(onboarding): Phase 2 — one first run
c8b8d66 fix(smoke): close Phase 1's gate — the four failing steps were the harness
62c8e5a fix(home): Phase 1 — one road
72abafe docs: the UX journey audit and the four-phase plan
cc99ce3 test(camera): make the 0% grading failure impossible to ship again
2e02496 fix(camera): the mirror trigger was inverted — every letter graded 0%, always
52492df Merge: the coherence pass — 130 defects in the seams between screens
0518894 fix(shots): the screenshot harness was broken by the coherence pass
4ce94b8 docs: plain-language list of every user-visible change in the coherence pass
c27bbc8 fix: 130-defect coherence pass, the seams between screens
```

**Diff stat:**
```
(no unstaged changes)
```
