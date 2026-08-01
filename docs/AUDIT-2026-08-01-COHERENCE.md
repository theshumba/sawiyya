# Sawiyya coherence audit, 2026-08-01

17 agents across 8 lenses. 147 findings raised, 130 confirmed after adversarial verification (17 refuted).

Severity: 17 high, 63 medium, 50 low. Full finding records with file:line and evidence in `docs/audit-findings-2026-08-01.json`.

## Verdict

No, it does not hang together, and the reason is structural rather than cosmetic: Sawiyya was assembled screen by screen from the `.dc.html` mockups with no shared spine, so every screen invented its own answer to the same four questions. There is no router (`src/store/ui.ts` is a single Zustand atom with no history), so Back exits the installed PWA from every screen and each takeover hardcodes a different escape hatch. There is no single component for "show me this sign", so the Dictionary renders a static medallion with three inert Watch controls while Words renders a working `SignDemo` for the same content. There is no single source for "how many letters are there", so 28, 31 and 28-with-a-31-numerator all ship on adjacent screens. And the honest content limits (19 A1 words with no footage and no camera grading) were patched per screen instead of modelled once, so five surfaces route non-gradable signs into the camera, into teach mode, or into a dead CTA. The individual code is careful and heavily commented; the incoherence is entirely in the seams between screens.

## Fix batches

### Batch 1 · Dictionary is a dead end (highest impact)
**Files:** `src/screens/AllSigns.tsx`, `src/content/signs.ts`
**Closes:** `allsigns-watch-is-a-noop`, `ds-dictionary-watch-is-inert`, `as-watch-practise-noop`, `allsigns-watch-buttons-do-nothing`, `dict-watch-button-does-nothing` (all one defect), `allsigns-sheet-overflows-viewport`, `detail-panel-features-split-by-breakpoint`, `dict-add-to-review-desktop-only`, `arabic-gloss-printed-twice`, `typebadge-gold-contrast-fail`, `ds-allsigns-motion-badge-contrast`, `status-meta-caption-contrast`, `dictionary-labels-words-unit-1`, `ds-unit-numbering-contradiction` (AllSigns half), `alphabet-counted-four-different-ways` and `alphabet-count-31-vs-28` (AllSigns half), `ds-white-vs-paper-split`, `ds-off-palette-grey-text` (AllSigns placeholder)

Order:
1. Add `max-h-[88dvh] overflow-y-auto overscroll-contain` to the mobile sheet at `:379` (Words.tsx:115 is the working pattern). Nothing below matters until the panel is reachable.
2. Replace the medallion block `:620-658` with `<SignDemo sign={sign} lang={lang} />`; delete `watched`/`handleWatch` and both duplicate play controls. Gate the panel's own hint block `:690-711` behind `!demoShowsHint(sign)` and drop the duplicate A1 provenance note, exactly as Words.tsx:135 does.
3. Replace the inert `signWatchPractise` CTA for non-gradable signs with the Words self-mark: `recordDrillResult(sign.id, "hard", { selfMark: true })`, deriving the "marked" confirmation from the store (`progress[id].lastSeen === today`), not local state, since the sheet reopens freely.
4. Ungate `Add to Daily Review` from `md:inline-flex` (`:741`), ungate the header favourite (`:599`), let the action row wrap.
5. Export `SEEDED_ALPHABET` from `signs.ts:169`; use it for both numerator and denominator at `:149-152`.
6. Derive unit labels from `UNITS.findIndex` at `:36`, `:46`, `:161` so words read Unit 2.
7. Contrast/colour sweep in this file only: `TypeBadge` gold branch to `#7F621F`, `STATUS_META` tones to `text-muted`, `bg-white` card at `:483` to `bg-paper`, placeholder `#94A5A2` to `text-muted`, and the secondary gloss to the other language (`Words.tsx:214` pattern) so Arabic stops printing "ا · ا".

Must run before Batch 8 (Progress consumes the `SEEDED_ALPHABET` export).

---

### Batch 2 · Navigation spine and the Practise tab
**Files:** `src/store/ui.ts`, `src/App.tsx`, `src/screens/PractiseChooser.tsx`, `src/screens/CameraPractice.tsx`, `src/screens/Fingerspell.tsx`, `src/screens/Words.tsx`
**Closes:** `nav-no-url-no-history`, `no-browser-history-integration`, `hardcoded-back-destinations`, `nav-back-targets-contradict`, `practise-back-buttons-leave-tab`, `back-target-inconsistency`, `cam-practice-stops-camera-every-letter`, `cp-camera-dies-after-every-match`, `practise-hub-two-identical-tiles`, `ds-practise-gold-tile-unreadable`, `fsp-no-exit-from-practise`, `fsp-empty-state-lies`, `ds-fingerspell-dead-hover`, `ds-hit-target-drift` (34px back buttons), `words-selfmark-repeatable`, `words-hands-badge-icon`, `words-practised-tick-unannounced`, `cam-edge-letters-teach-mode` (strip half), `ungradable-signs-fall-into-teach-mode` (strip half)

Order:
1. Hash routing in `ui.ts`: serialise `Screen` to `#/…`, `pushState` in `go`, module-level `popstate` listener, initialise from `location.hash`. Add a `backOrParent(parent)` helper, because a cold load or PWA `start_url` has no in-app entry to pop.
2. Point all three in-content back buttons at `backOrParent({name:"practiseChooser"})` and unify them to the 40px `ScreenShell` size. Onboarding keeps its own step machine and is handled in Batch 9.
3. `CameraPractice`: track "camera has actually run" (flip only on `result === "match"`, not on selfMark/skip, or a first-time permission prompt fires unasked) and pass it as `autoStart`. Filter the letter strip to `cameraGradable`, rendering the three edge forms as non-selectable reference chips so they do not vanish from the app.
4. `PractiseChooser`: delete tile 3. A real free mode needs the OOD gate, not `classify()`, and is not worth building now. Parameterise `TILE_TITLE`/`TILE_SUB`/`CHIP` on foreground and give the remaining gold surface `text-ink`.
5. `Fingerspell`: add a "Stop practising" ghost under the trainer in the `practising` branch; branch the empty stage on `steps.length > 0` so digits get the skipped-characters card, not "Type a word to begin"; swap the keypad inset shadow for a real `border border-line` so the hover state exists. Leave the 40px key size alone.
6. `Words`: per-day guard on the self-mark using `progress[id].lastSeen`; two-hand badge icon to `sign_language`; `aria-label` carrying the practised state on `WordCard`.

Blocks nothing, but Batch 4 and Batch 6 both become simpler once `backOrParent` exists.

---

### Batch 3 · Camera tells the truth
**Files:** `src/components/CameraTrainer.tsx`, `src/recognizer/classifier.ts`, `src/recognizer/useHandTracker.ts`, `src/recognizer/knn.ts`, `src/recognizer/seedStore.ts`, `src/recognizer/classifier.test.ts`
**Closes:** `cam-ood-meter-lies`, `cam-mixed-confidence-scales`, `cam-unsure-never-clears`, `cam-seed-load-failure-silent`, `cam-stream-leak-on-start-throw`, `cam-dead-track-not-detected`, `cam-error-copy-conflates-model-failure`, `cam-edge-letters-teach-mode` (trainer guard), `ungradable-signs-fall-into-teach-mode` (trainer guard), `cam-dead-play-button`, `cameratrainer-fake-play-button`, `cam-reached-label-always-on`, `cam-reteach-destructive-noop`, `build-string-in-privacy-chip`, `cam-own-recording-misattribution`

Order:
1. `gradeWithModel`: `confidence: inDistribution ? targetP : 0`, and add `inDistribution: boolean` to `ModelGrade` (CameraTrainer cannot test the gate today, `OOD_GATE` is unexported). Update `classifier.test.ts:41-56` to assert the zeroed value.
2. Force the coach's `{kind:"reference"}` advice when `targetP >= MODEL_TAU && !inDistribution`, so the learner is told why the ring will not start.
3. Only then normalise the mixed MLP/KNN meter. Doing it before step 1 makes the lying 100% worse.
4. `showUnsure`: clear it once a hold streak starts, guarded by a ref so it does not push state every matching frame.
5. Refuse teach mode when `!sign.cameraGradable`: render the reference photo, the `fspRefOnly` note and self-mark instead. This closes the Progress and letter-strip routes at the same time.
6. Move `clearClass` out of `startTeach` to the first `addSample`, and add a Cancel back to grade mode.
7. `useHandTracker`: stop tracks in the outer catch before `setStatus("error")`; add `ended`/`mute` listeners plus a 2s `currentTime` watchdog; split the error panel on `errorKind` (denied, notfound, other) with a CPU-delegate retry, and point the denied branch at browser site settings rather than a retry that cannot re-prompt.
8. `seedsFailed` state with an honest band and a retry that re-sets `seedsReady.current`.
9. Delete the fake gold play span at `:459`; gate `camReached` on `meter >= 1`; gate the build string behind the existing `DEBUG` flag; source-tag KNN neighbours so `ownRecording` is only claimed when the winning weight came from the user's store.

---

### Batch 4 · Lesson loop stops lying about completion
**Files:** `src/screens/LessonPlayer.tsx`, `src/lesson/engine.ts`, `src/screens/FirstSign.tsx`
**Closes:** `ds-lesson-complete-no-path-change`, `ds-duplicate-recall-in-word-lessons`, `ds-accuracy-100-when-everything-skipped`, `ds-lesson-check-button-invisible`, `lesson-disabled-check-invisible`, `lesson-hardcoded-arrows`, `recall-drill-identical-glyphs`, `ds-word-lesson-camera-lands-on-alif` (results-card half), `ds-off-palette-grey-text` (LessonPlayer sites), `softfail-double-counts-camera-metrics` (call sites)

Order:
1. End-card only: when the queue drains and `lesson.signIds.some(id => mastery < 2)`, suppress `celebrate()`, `recordLessonComplete()` and `lsLessonDone`, and render a "part 1, N letters still to practise" continuation card. Restrict the learned-chip list at `:119-121` to the signs actually drilled this pass. Do NOT touch `MAX_DRILLS` or the trim order: two-pass truncation is pinned at `engine.ts:92-96` and asserted by `curriculum.test.ts:105-129`.
2. Hide the accuracy tile when `scored.current === 0` instead of printing 100%.
3. `engine.ts`: exclude already-queued ids from the productive recall top-up at `:70-73`.
4. Branch the results-card camera buttons on `cameraGradable`; drop the "Practise on camera" aria-label from chips that cannot open it.
5. Give word recall tiles the hint text in the glyph slot (the `SignDemo` precedent) so four answers stop looking identical. Do not reintroduce emoji here, see Deferred.
6. Disabled `Check` button: dark label on the disabled fill plus `disabled:opacity-100` on the override. `#566B68` on `#EDE3D2` is 4.47:1 at 16px bold, so use `text-ink/70`. Replace the six `#94A5A2` sites with `text-muted`. Replace the three literal `→` with `{lang === "ar" ? "←" : "→"}`.
7. Pass `{ softFail: true }` at the three soft-fail sites (needs the store option from Batch 6).

Runs after Batch 6 for step 7 only; steps 1 to 6 are independent.

---

### Batch 5 · Home path and milestones
**Files:** `src/screens/Home.tsx`, `src/lesson/milestones.ts`
**Closes:** `home-done-lesson-opens-alif`, `ds-word-lesson-camera-lands-on-alif` (Home half), `home-treasure-node-always-locked`, `path-sheet-meta-contradicts-node`, `ds-terminal-milestone-unreachable`, `home-milestone-card-generic-camera`, `home-unit-banner-covers-both-units`, `home-unit-banner-mismatches-trail`, `ds-path-restarts-after-completion`, `home-path-resets-to-current-when-complete`, `home-node-aria-label-lies`, `ds-home-start-cta-contrast`, plus the one-line Home half of `fam-solo-flag-noop`

Order:
1. Compute `cameraTarget` once above `onAction` and reuse it; when it is undefined for a `done` node, route to `{name:"lesson", lessonId}` instead of dropping the learner on Alif.
2. Milestone sheet: render `ms.label` and `ms.progress` instead of the fixed `pathChestMeta`, and give it a live route (lesson or Words for the mastery rungs, `{name:"family"}` for the family rungs). Never a camera CTA for the word-unit rung. Handle `nextMilestone() === null` with a completion card.
3. Drop `onClick` from the milestone card so Home stops having two copies of the same milestone, one tappable and one dead. Leave `GoalCard`'s onClick, it is deliberate.
4. Reorder the node status ternary so `complete` wins over `current`, and let `nextLesson` be undefined when everything is done.
5. Group `pathNodes` by `unitId` and emit one banner per group.
6. Per-status `aria-label` plus `aria-haspopup="dialog"` on path nodes.
7. Swap the sheet's inline hexes: `#E8654C` to `#B54834`, `#C54F3A` to `#9C3D2C`, `#8FA09D` to `#566B68`. Do not swap in `<Button>`, the geometry and `disabled:opacity-40` both regress the sheet.
8. Delete the `raisedByProfileId !== profile.id` filter at `:103` for solo households only. Depends on Batch 6.

---

### Batch 6 · Family, flags, and the store
**Files:** `src/store/app.ts`, `src/types.ts`, `src/screens/FlagPicker.tsx`, `src/screens/Family.tsx`, `src/components/AppNav.tsx`
**Closes:** `fam-solo-flag-noop`, `flagpicker-noop-for-solo-household`, `fp-alphabet-unflaggable`, `fp-camera-promise`, `flagpicker-camera-icon-never-opens-camera`, `fp-self-requestor`, `fp-famflagged-copy`, `fp-most-needed-noop`, `fp-hooks-after-return`, `family-mastery-dots-no-name`, `no-way-to-remove-a-profile`, `profile-badge-points-at-wrong-screen`, `appnav-menu-no-arrow-keys`, `softfail-double-counts-camera-metrics` (store half), `pr-streak-celebration-unreachable` and `pr-achievement-revoked-on-lapse` (store fields), `unlabelled-name-inputs` (Family half)

Order:
1. `toggleFlag`: seed the raiser's own SRS card when `s.profiles.length === 1`. Gate on the solo case only, the broader "not deaf" variant contradicts H4 and `family.test.ts:47-57`.
2. Add `bestStreak` and `celebratedStreak` to `Profile`, backfilled in `normalizePersisted`; add a `softFail?: boolean` option to `recordDrillResult` that skips the `drillsCompleted` increment; add `removeProfile` (drop progress, srs, own flags, supporter entries, reassign `activeProfileId`).
3. `FlagPicker`: move the `!profile` guard below the hooks; add a `letters` group backed by `ALPHABET.filter(s => s.cameraGradable)` and widen `groupOf`; change the search branch to `ALL_SIGNS` matching `code` so typing "ب" works.
4. Branch the row and CTA icon on `s.cameraGradable` (`videocam` vs `visibility`) instead of drawing the camera icon before the branch is known.
5. Drop the `?? requestors[0]` self-fallback on `heroRequestor`; add `famFlaggedCount` and stop using the predicate "needs this" as a noun. Hide or repurpose the Most Needed toggle when nothing is flagged.
6. `Family`: fold per-learner mastery levels into the row's own `aria-label` at `:279` (an inner `role="img"` will not surface, the button label wins); add `aria-label` to the add-member input; surface `removeProfile` behind a confirm.
7. `AppNav`: move the request badge onto the Family tab; replace `role="menu"`/`menuitem` with `role="dialog"`, matching the L11 convention the codebase already chose elsewhere.

Must run before Batch 5 step 8 and Batch 4 step 7 and Batch 8 steps 3 to 4.

---

### Batch 7 · Copy that claims things the app does not do
**Files:** `src/i18n.ts`, `src/screens/Settings.tsx`
**Closes:** `home-gold-vs-xp-same-number`, `ds-done-node-claims-mastered`, `dominant-hand-control-does-nothing`, `ds-dominant-hand-does-nothing`, `cam-handedness-setting-does-nothing`, `dominant-hand-setting-is-dead` (Settings and copy halves), `settings-goal-minutes-untranslated`, `settings-name-persists-per-keystroke`, `ds-settings-chevron-invisible` (Settings half)

Order:
1. `homeGoldStat` becomes the XP label. `pathDoneMeta` becomes "Practised, tap to review".
2. Delete the `HandCards` block and its Settings row. Keep the `dominantHand` field. Do not mirror reference photos: they are licensed ArSL21L signer stills and flipping them breaks the provenance rule the app states in three places. Rewrite `obHandSub` and the InfoPages "left or right" line to stop claiming a camera effect (InfoPages copy lands in Batch 10).
3. Localise the goal minutes by splitting the existing `obCasual`/`obRegular`/`obSerious` strings rather than adding a second source.
4. Name input: local state, commit on blur and Enter, trimmed non-empty fallback. Ignore the per-keystroke persist concern, the blob is tiny.
5. Row chevron to `text-muted`.
6. Add the keys other batches need: `famFlaggedCount`, the camera error variants (denied / notfound / load-failed), the streak-celebration line without a name, and the lesson continuation-card strings.

Must run before Batches 5, 6, 8 and the copy steps of 3 and 4, since those consume new keys.

---

### Batch 8 · Progress screen
**Files:** `src/screens/Progress.tsx`
**Closes:** `pr-utc-daykey-vs-local-todaykey`, `ds-progress-weekly-grid-uses-utc`, `ds-alphabet-achievement-counts-31-against-28`, `alphabet-count-31-vs-28` (Progress half), `progress-oasis-is-static-art`, `ds-streak-celebration-never-fires`, `pr-streak-celebration-unreachable` (render half), `streak-celebration-names-the-user`, `streak-celebration-latin-days`, `streak-celebration-no-scroll`, `achievements-locked-text-invisible`, `pr-achievement-revoked-on-lapse` (render half), `progress-hardcoded-gold-numbers-unreadable`, `constellation-forced-ltr`, `ungradable-signs-fall-into-teach-mode` (Progress route), `progress-hooks-after-early-return`, `ds-gold-on-gold-tint` (Progress site), `brand-images-absolute-404` (the `stitch-46` line), `ds-off-palette-grey-text` (Progress sites)

Order:
1. Move the `!profile` guard below every hook.
2. Delete the local UTC `dayKey`; import `todayKey` from the store and call it with an offset Date.
3. Fire the celebration from `celebratedStreak` (Batch 6) instead of a per-mount ref; write it back on dismiss.
4. Feed `bestStreak` to `AchievementsTab` so the 7-day badge stops un-earning.
5. In the celebration: drop the interpolated `profile.displayName` line, use `DAY_LABELS_AR` and remove the `dir="ltr"`, add `overflow-y-auto overscroll-contain` with `justify-start` plus `my-auto`. Leave the footer positioning alone, the finding's claim there is wrong. Fix the `stitch-46` path.
6. Gate the alphabet numerator on `cameraGradable` and use `SEEDED_ALPHABET.length` for all three denominators (Batch 1 exports it).
7. Bind the oasis scene to `alphaTaught` and `mastered` by mapping over arrays instead of two hardcoded palms.
8. Gate `onSign` at `:208` on `cameraGradable`, routing non-gradable signs to `allSigns`.
9. Remove `dir="ltr"` from the Constellation grid and the redundant inner `dir="rtl"`.
10. Colour: `#E6B24C` and `#C89A3D` text to `text-gold-deep`, `text-gold` on gold tint to `text-gold-deep`, drop the 0.72 container opacity on locked achievements, and use `text-muted` for both branches of the status line (the earned branch fails too).

Depends on Batches 1 and 6.

---

### Batch 9 · Onboarding
**Files:** `src/screens/Onboarding.tsx`, `src/components/ErrorBoundary.tsx`
**Closes:** `ob-learn-step-is-inert`, `ob-alphabet-card-ends-onboarding-early`, `onboarding-fastpath-skips-name`, `ds-onboarding-alphabet-card-ends-setup-early`, `ob-skip-discards-answered-steps`, `ob-skip-overwrites-explicit-choices`, `onboarding-min-h-screen`, `unlabelled-name-inputs` (Onboarding half), dominant-hand step removal

Order:
1. Store the learn-step answer as `track` and honour it in `finish()`: alphabet to the camera, words to `{name:"allSigns"}` (Words is one tap from a screen the user has never seen unless Batch 2 has landed). Render the Gulf-dialects card `disabled`/`aria-disabled` or demote it to a note.
2. Route the alphabet card to the `name` step with the destination stashed, so no profile is ever created called "Me". Do the same for the header Skip. Fix both handlers in one edit, they collide.
3. Delete the `skipAll` overrides so Skip keeps answers already given, and remove the now-unused flag from `finish`'s signature.
4. Remove the `hand` step from `STEP_ORDER`.
5. `min-h-screen` to `min-h-dvh` in both wrappers and in `ErrorBoundary.tsx:62`; add `safe-bottom` to the footer and to the name step's own submit block, which the `step !== "name"` guard skips.
6. `aria-label` on the name input.

Depends on Batch 7 for the reworded hand copy only.

---

### Batch 10 · Live-site image 404s and info pages
**Files:** `src/screens/InfoPages.tsx`
**Closes:** `brand-images-absolute-404`, `brand-images-404-on-pages` (six of seven paths), `infopages-rtl-double-flip`, `ds-gold-on-gold-tint` (InfoPages site), `ds-settings-chevron-invisible` (InfoPages arrow)

Order: strip the leading slash on `:51, :60, :69, :78, :91, :317`, or import the assets so a missing file becomes a build error; delete `rtl:md:flex-row-reverse` at `:185`; `text-gold` to `text-gold-deep` at `:251`; step arrow at `:146` to `text-muted`. Add a build-time grep for `"/brand/` so it cannot regress. Smallest batch here and the only one whose defect is visible on the deployed URL right now.

---

### Batch 11 · Token layer stops lying
**Files:** `tailwind.config.js`, `src/styles.css`, `src/components/Tile.tsx`, `src/components/dc.tsx`, `design/rebuild-source/DESIGN-SYSTEM.md`
**Closes:** `ds-dead-tokens-and-utilities`, `ds-gold-deep-token-lies` (documentation half only), `ds-unused-canonical-primitives` (deletion half), `ds-font-mono-undefined`

Order: delete `danger`, `ease-enter`, `ease-exit`, the shimmer and confetti keyframes, `.extruded-paper`, `.extruded-teal-pressed`; add `gold.edge` / `coral.edge` / `teal.edge` for `#C89A3D` / `#9C3D2C` / `#0A4F4C` rather than renaming `gold.deep`, which would silently repaint 16 live `text-gold-deep` call sites back to 2.26:1; correct DESIGN-SYSTEM.md §1 to the shipped values; delete `ConfidenceRing` (it is not the hold ring and substituting it would announce a bogus progressbar) and delete `Tile`/`OnDeviceBadge` or adopt them, not both; either vendor a mono face or drop `font-mono` in favour of the existing `Eyebrow` treatment.

## Deferred

- `ds-hardcoded-hex-sprawl`, `ds-type-scale-absent`, `ds-card-treatment-sprawl`, `ds-progress-meter-variants`, `ds-icon-vocabulary-split`, `ds-white-vs-paper-split` (the 47-site `text-white` sweep): real, but each is a whole-codebase sweep that would collide with every batch above. Do them after the behavioural batches land, one file at a time.
- `ds-two-button-systems`: the useful half (one variant for the forward action in LessonPlayer) is already in Batch 4. The full merge is blocked because dc's `ghost` is a filled sand chip and ui's is a transparent teal outline, so three call sites over dark surfaces would break.
- `ds-focus-ring-inconsistency`: cannot be fixed by deleting the overrides. The base rule hardcodes `ring-offset-sand` and a gold ring is invisible on gold surfaces, so it needs a two-tone rule designed first.
- `glyph-identical-word-icons`: the proposed emoji fix reverses H14, a documented owner decision that purged emoji from exactly those four surfaces. Needs his call before touching.
- `ds-gold-deep-token-lies` rename half: renaming the token requires migrating 16 call sites in the same commit or it silently reintroduces the contrast failure H15 removed. Not worth the risk for a naming improvement.
- `ds-hit-target-drift` keypad half: 40px Arabic keys match system keyboards; raising 29 keys to 44px pushes the letter pad below the fold on a small phone.
- `cam-own-recording-misattribution` via `classifyAgainstUser`: restricting top-K to the user's store changes the neighbourhood the distance and margin gates were calibrated against. Only the source-tagging variant is safe, and it is already in Batch 3.
- `ds-terminal-milestone-unreachable` rung change to mastery >= 2: optional polish. The pathChestMeta and null-milestone halves are in Batch 5; the rung itself is impractical rather than impossible.
- ESLint `react-hooks/rules-of-hooks`: the project has no ESLint at all, which is why the existing `eslint-disable` comment in FlagPicker is inert. Adding a linter is a separate decision from the two hook-order moves, which are already in Batches 6 and 8.