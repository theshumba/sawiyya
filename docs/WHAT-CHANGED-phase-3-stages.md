# What changed · Phase 3 "Stages"

Branch `feat/phase-3-stages`. Nothing is pushed and nothing is deployed.

The goal from the plan: **the app knows how far along you are and introduces itself over time.**

Before this, Sawiyya knew your XP, your streak and your mastery, and nothing about you. It could not
tell a learner on their first minute from one on their thirtieth day, so it said the same things to
both, and the parts of the app that are not the trail (reviews, the family flag, keeping your
progress) were never mentioned to anyone.

---

## What a learner sees

**A "Getting started" list on Progress.** Six things, in order, that between them show the whole app:
sign your first letter, finish your first lesson, keep your progress, do a review, ask for a sign,
finish a whole unit. They tick themselves off as you go. Only the row you are on explains itself, and
only that row can be tapped. Once there is nothing left, the whole list disappears for good.

**One row of it on Home, and only sometimes.** Phase 1 deleted Home's eight-card stack because it
offered nine answers to "what do I do now". So Home shows a getting-started row **only when the trail
cannot already say it** — keeping your progress, doing a review, asking for a sign. "Sign your first
letter", "finish your first lesson" and "finish a whole unit" are the trail, and Home stays quiet
about them. Most of the time the strip is not there at all.

**"Keep your progress", not "install the app".** Everything a learner has done lives in this
browser's storage, and iPhones delete that after seven unused days unless the app is on the home
screen. On Android the row opens a real one-tap install. On iPhone there is no such button in any
browser, so it writes the steps down instead of showing a button that does nothing. It can be put
aside with "Not now", and it stays in the list.

**Hints in empty states.** Three places where the screen is empty and the reason is not obvious: the
family board with nothing on it, "nothing due" on Progress, and a household of one. **At most one
hint appears per app open, and never on the screen the app launched on** — front-loaded tours test
worse than nothing. Once you have met a hint it does not come back.

**An existing learner is not told to start over.** Anyone already using Sawiyya gets their ladder
filled in from what the app already recorded them doing, so a learner who has half the alphabet is
not greeted with "sign your first letter".

---

## Two places the plan was not followed to the letter

**1. The plan's backfill rule would have lied.** Point 5 says completing a later step marks the
earlier ones done, "or one skipped step wedges the pointer forever". Taken literally that ticks four
steps for a learner who taps "ask for a sign" on their first minute, having done no drill, no lesson
and no review. Each step now lists what it genuinely proves: finishing a lesson proves a first sign,
finishing a unit proves a lesson, and asking for a sign proves nothing at all. Nothing wedges,
because every step that proves nothing can be put aside instead.

**2. `firstOpenAt` was not added.** It is already in the app as `metrics.appFirstOpenAt`, recording
the same fact. Two fields holding one fact is the naming mess Phase 4 exists to clean up, not one to
add.

Also worth saying plainly: the plan's per-feature "rev" map (point 9) ships with **no features in
it**, so nothing marks itself as new today. It is in now because it cannot be added later: the rule
only works if it is written down on a learner's genuinely first run, and every learner who onboards
before it exists would otherwise meet a pile of "new" badges at once.

---

## What was NOT touched

- The trail, the lock, the lessons, the camera, the grading. No curriculum change of any kind.
- The mastery ladder on Home's treasure chest and Progress's "Next milestone". That is a different
  ladder about signs learned; this one is about the app introducing itself. They are deliberately
  kept apart, and this one is called "Getting started" so the app does not have two things called
  milestones.
- The 19 word signs, the dictionary padlock, and the mascot. All still open, all unchanged.

---

## How it was checked

- `npx tsc -b` clean · `npx vitest run` **214 passed** across 22 files, up from 162 across 19 (52
  new: the ladder's rules, the hint budget, and the store slice against real persisted blobs)
- `npm run build` green
- `node scripts/smoke.mjs` — five new steps: Home stays quiet while the trail is the answer; the
  ladder reports what actually happened (including that it does **not** claim an install that never
  happened); the hint budget holds; the install sheet offers written steps on a browser with no
  install prompt; a step can be put aside and the pointer moves on.
- Two pre-existing harness faults were fixed while doing it, both of which had been passing for the
  wrong reason: the lesson loop stopped at the part-done card and so never actually completed a
  lesson, and "lesson end card → home" only knew one of the two labels that card can carry.
