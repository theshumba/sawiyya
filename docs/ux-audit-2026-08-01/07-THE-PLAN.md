# Sawiyya: the plan

2026-08-01. Built from the audit in `00-THE-PICTURE.md`. Nothing here has been executed.

**Working assumption, stated so it can be vetoed:** Sawiyya is being fixed as a real product, not as a
grant demo. Everything that makes it a good product also makes it a good demo; the reverse is not
true, so this is the safer default.

**Not a revamp.** The design is not what's broken and it stays. Eight passes have already changed how
Sawiyya looks or behaves. This adds the one thing none of them touched: sequence.

**Rules for every phase.** Sawiyya deploys from `main` via GitHub Pages, so **merging is deploying**.
Each phase gets its own branch and waits for his eyes. Do not touch the recognizer, the trained model,
or the content pipeline. Do not re-skin. Fanan stays in place until he gives a direction.

**Gate for every phase:** `tsc` clean, full test suite green, build green, headless drive with zero
console errors, 390px screenshots captured in English and Arabic, and a plain-language
`WHAT-CHANGED` note written for him to veto before merge.

---

## Phase 1 · One road

**Goal:** the app offers one obvious thing to do, and the padlocks stop lying.
**Effort:** about a day. Roughly 80% deletion.

1. **Home loses its second menu.** Delete Block D (`Home.tsx:403-642`): the Practise, Everyday words,
   Spell your name, Review due, review-cap, new-letter, all-caught-up, Daily goal and both milestone
   cards. The trail becomes the whole screen.
2. **Family flags move up, not out.** Promote the flag card above the trail, shown only when there is
   a live request. This is the differentiator and must not end up buried.
3. **Today's goal moves into the top bar.** The gold chip currently shows lifetime XP, which is not
   actionable. Swap it for `xpToday / goalXp`. Streak and family count stay as they are. This is the
   one real piece of new code in the phase.
4. **Camera doors: 17 down to 3.** Keep the current node's lesson, the Practise tab's Alphabet tile,
   and a sign's own detail sheet. Fix the two that are not actions: `Settings.tsx:316` (the status
   text "Not granted yet" is currently the button) and `InfoPages.tsx:197` ("Let's Practice Together"
   on the AI explainer). The Daily goal card stops being a button entirely. The full inventory with
   file:line is in `02-screen-purpose-map.md`.
5. **Make the lock real.** Add a prerequisite check in `LessonPlayer` and `buildDrillQueue` so
   `#/lesson/<any-id>` cannot bypass it. Remove the live `onClick` from the Dictionary's locked cells.
   Stop four Words self-marks completing the fifth trail node on day one. Locked nodes stay visible
   and grey, per the training-wheels evidence; only the copy changes, because
   "Finish the sign before this to unlock" (`i18n.ts:233`) currently describes something the app does
   not do.
6. **Delete the duplicate Settings row** (`Settings.tsx:271` and `:441` are the same row twice).

---

## Phase 2 · One first run

**Goal:** everybody gets the same first run, and it explains the app.
**Effort:** about a day and a half.

1. **Delete the branching.** Remove the track routing at `Onboarding.tsx:150-156`. There is one
   sequence and everyone gets it, which also retires the "Everyday signs" track that currently cannot
   reach the aha moment.
2. **The new sequence:** language, then three questions (why you're learning · what you already know ·
   which days you'll practise), then a recap screen, then your name, then the camera explained in a
   sentence before the browser prompt, then FirstSign, then Home with the first node lit.
3. **Everyone gets the same lesson one.** Per the Headspace finding, the asking is the mechanism, not
   the matching. The answers are stored and surfaced, they do not branch the curriculum.
4. **The practise-days answer gets written back onto Home**, so the question visibly mattered.
5. **Delete `obRoleBody`** ("We'll start you on the signs that matter most", `i18n.ts:20`). It is not
   implemented and would now be untrue by design.
6. **Name the four tabs once**, on the recap screen or on first arrival at Home. Right now they are
   never named anywhere.
7. **Open item for him:** the 19 word signs still cannot be practised, only viewed. Retiring the
   track hides the problem, it does not solve it. Flag, do not silently decide.

---

## Phase 3 · Stages

**Goal:** the app knows how far along you are and introduces itself over time.
**Effort:** about a day and a half. Roughly 120 lines, no new dependency.

1. **One persisted slice** in the existing Zustand store: `milestones`, `seen`, `dismissed`,
   `firstOpenAt`.
2. **Two ordered const arrays**, `MILESTONES` and `HINTS`. Array order is the priority, which is what
   keeps this from turning into a rules engine.
3. **Stage is derived, never stored.** Adding or removing a stage then needs no migration and nobody
   strands in a stage that no longer exists.
4. **One canonical next action:** `STEPS.find(s => !completed.has(s.id))`.
5. **Backfill rule:** completing a later milestone marks the earlier ones done, or one skipped step
   wedges the pointer forever.
6. **Draft milestone ladder:** first sign graded · first lesson complete · installed to home screen ·
   first review session · first family flag raised · first unit complete.
7. **The install milestone is worded "keep your progress"**, never "install the app". iOS Safari
   deletes localStorage after seven days unused and installed web apps are exempt, and every bit of a
   learner's progress lives in localStorage. Android and Chrome get `beforeinstallprompt`; iOS needs
   written instructions.
8. **Hints go in empty states, not a tour.** Front-loaded tutorials tested worse than nothing.
   Budget: one hint per session, never at launch, tracked by an in-memory session flag that is not
   persisted.
9. **A per-feature `rev` map** so a future feature can re-introduce itself, plus the cold-start rule:
   on a genuinely first run, write all current revs into `seen`, or a brand-new learner meets five
   "new" badges at once.

---

## Phase 4 · Say what things are

**Goal:** every screen states its own purpose.
**Effort:** about a day.

1. **Home gets a visible title** above the trail. Its `<h1>` is currently a greeting and the trail is
   announced only to screen readers.
2. **Progress gets rebuilt as a readout.** Drop "Your oasis" as the heading, give it a door that is
   not hidden inside a popover behind the user's own avatar, reconcile "palms grown" and "signs
   planted" with "signs mastered", and cut or fix the three tabs that have no action.
3. **One name for the dictionary.** It currently has four. Move its only interaction instruction out
   of the `md:block` aside that never renders on a phone.
4. **Resolve Words versus Signs.** They run the identical sheet and write the identical result.
   Recommendation: merge Words into Signs as a filter, which deletes a screen and removes the worst
   naming collision in the app.
5. **Tone pass**, using Duolingo's published rules since they are free and specific: no punctuation in
   buttons, no full stops in headlines, exclamation marks only on success, digits even under ten.
   Quiet exits in small grey text, forward actions as the full-width coloured button.

---

## Owner-gated, deliberately not scheduled

- **The mascot.** Fanan the fennec fox is rejected with no replacement chosen. He is drawn
  geometrically in `src/components/Fanan.tsx` rather than loaded as an image, so replacing him means
  new artwork plus a new component, and every pose in use has to survive the swap.
- **The content decision**, still open since the coherence audit: shrink the promise to an honest
  Arabic fingerspelling trainer, or chase a Deaf QSL signer relationship for real word footage.
  Phase 2 item 7 waits on this.

---

## Order and why

Phase 1 first because it is the cheapest, the least risky, and the one he will feel the moment he
opens the app. Phase 2 second because the first run is the highest-leverage screen in any learning
app and it is currently the most broken. Phase 3 third because sequencing needs something worth
sequencing, which phases 1 and 2 create. Phase 4 last because naming is cheap and reads better once
the structure has stopped moving.

Total: roughly a week of build, four separate branches, four separate looks from him.
