---
date: 2026-08-01
branch: main
status: in-progress
---

# Session handoff: Sawiyya UX audit — why the app doesn't make sense, and the plan to fix it

## Resume protocol

1. Read this whole file
2. Run: `git status && git log --oneline -5`
3. Open: `docs/ux-audit-2026-08-01/00-THE-PICTURE.md`, `docs/ux-audit-2026-08-01/07-THE-PLAN.md`
4. Ask Melusi: "Start Phase 1, or answer the content question first?"

> **Scope note:** in-repo work was **documentation only**. No source file was edited, nothing was
> committed, nothing was deployed. The two untracked paths in `git status` are this session's output.
> Out-of-repo: one new memory file (`sawiyya-mascot-fox-rejected.md`) plus its `MEMORY.md` pointer.
> Also note `main` moved during this session from another session's work: `2e02496` and `cc99ce3`
> (camera mirror-trigger fix) are not from here.
>
> **Variant:** Exploration.
>
> **NOTHING IS APPROVED.** Melusi asked for a plan and explicitly said do not execute. He has not
> agreed to any phase, and he did not answer the question about what Sawiyya is for now.

## Task state

**What we were doing:** Melusi said Sawiyya "doesn't feel intuitive and as clean" as Duolingo or
Headspace and couldn't name why, then asked for a full audit with research agents. Six agents ran
(three auditing the code, three researching externally). Output is seven documents and a four-phase
plan. No code touched.

**Candidate next directions:**
- **Phase 1, "One road"** (~1 day, ~80% deletion): strip Home to the trail only, cut camera doors from
  17 to 3, make the padlocks actually enforce. Cheapest, least risky, most immediately felt. This is
  what was offered and what he has not yet said yes to.
- **Answer the content question first**, since Phase 2 item 7 depends on it and it has been open since
  the coherence audit.
- **Mascot replacement**, which he raised unprompted and deferred.

**Open threads:**
- **Is Sawiyya a real product or the Mada demo?** Asked twice, not answered. The Mada deadline was
  June 20 2026 and it is now August, so what happened there is unknown. The plan currently assumes
  real product and says so at the top, for him to veto.
- **The 19 word signs cannot be practised**, only viewed, because all are `cameraGradable: false`. The
  aha moment is unreachable on the "Everyday signs" onboarding track. Phase 2 retires that track,
  which hides the problem rather than solving it. Underlying choice, open since the coherence audit:
  shrink the promise to an honest Arabic fingerspelling trainer, or chase a Deaf QSL signer for real
  word footage.
- **Mascot.** Fanan the fennec fox is rejected ("I don't like the Fox as our mascot, I want to change
  that completely"). No replacement direction. He asked to be reminded. Saved to memory as
  `sawiyya-mascot-fox-rejected`.
- **Words vs Signs merge** (Phase 4 item 4) deletes a screen. Worth confirming with him before doing,
  not after.

**Blockers:** None technical. Everything is waiting on his go-ahead.

## Reasoning trail

**What we learned:**
- **The root cause is that the app has no model of user maturity.** One set-once flag (`onboarded`),
  read in exactly one place, never consulted again. Zero matches repo-wide for
  `hasSeen|firstTime|coachMark|tooltip|walkthrough|firstRun`. Day 1 and day 30 are the identical app.
  Everything else in the audit is a symptom of this.
- **Onboarding punishes engagement.** Three different first runs; tapping the prominent "Arabic
  Alphabet" button skips the tutorial, and tapping nothing is the only route to `FirstSign`. The only
  plain-language explanation of the core mechanic lives on a screen the fast path never sees.
- **17 camera doors under 9 names**, two of which are not actions at all (a status label in Settings, a
  heading on the AI explainer page).
- **The padlocks are decorative.** Lock is one `disabled` attribute, bypassed four ways. The unlock
  copy describes behaviour the app does not have.
- **Tour libraries store nothing.** react-joyride 3.2.0, shepherd.js 15.2.2, driver.js 1.8.0,
  intro.js 8.5.0 and @reactour/tour 3.8.0 were grepped in their published dist: zero hits for
  localStorage / sessionStorage / indexedDB. So staging is ~120 lines in the existing Zustand store,
  not a dependency decision. XState rejected on 12.7 kB vs Zustand's 1.3 kB.
- **Ask questions, then give everyone the same thing.** Headspace / Irrational Labs / Purchasely,
  April 2026: a short quiz followed by the *identical* course for everyone lifted course starts 31.25%
  → 62.97%, and beat the same course with no questions by 7.6 points. Asking is the mechanism, not
  matching. This is why Phase 2 has no recommendation engine.
- **Front-loaded tutorials test worse than nothing.** NN/g, 70 users, 4 apps: 91% success with
  tutorials vs 94% without, and the tutorial group rated tasks as harder. Teaching goes in empty
  states.
- **iOS Safari deletes localStorage after 7 days unused; installed PWAs are exempt.** Every bit of a
  learner's progress lives in localStorage, so "add to home screen" is a progress-durability
  requirement and belongs in the milestone ladder worded as "keep your progress".

**Tried and rejected:**
- **Diagnosing this as a home-screen problem only.** First answer was "too many front doors, cut Block
  D". He pushed back that it was more than that, and he was right: the missing thing is sequence, not
  layout. A next session should not re-land on the small version of this diagnosis.
- **A full revamp.** He asked directly whether one was worth it. Rejected because the memory index
  shows five prior design passes (Stitch redesign, Stitch frontend rebuild, Bright Stitch rebuild
  which he killed as "absolutely shit", Claude Design rebuild, nav redesign) plus three behaviour
  passes, and the app still doesn't make sense. Redesign cannot produce a sequence, because a sequence
  is not a screen. He has not confirmed agreement with this, but he did not push back either.
- **"Pure deletion" as a description of Phase 1.** Overstated and corrected in-session. Three parts are
  new code: moving today's goal into the top bar, moving the family flag card above the trail, and
  enforcing the lock in two files. Call it ~80% deletion.

## Code anchors

Read-only references; nothing here was edited.

- `docs/ux-audit-2026-08-01/00-THE-PICTURE.md` — the synthesis. Read this one first; the six numbered
  reports beneath it are the supporting detail.
- `docs/ux-audit-2026-08-01/07-THE-PLAN.md` — the four phases with per-item detail and effort.
- `src/store/app.ts:53` — `onboarded`, the only set-once flag in the codebase (written at `:401`, read
  only at `src/App.tsx:128`). The root-cause anchor.
- `src/App.tsx:137-193` — the entire router, fifteen `screen.name === "…"` branches, none consulting
  progress, XP, streak or any counter. Proof that day 1 and day 30 are identical.
- `src/screens/Home.tsx:403-642` — Block D, the eight-card stack Phase 1 deletes.
- `src/screens/Home.tsx:162-163` — the in-code comment recording that all 19 A1 word signs are
  `cameraGradable: false`. Load-bearing for the content decision.
- `src/screens/Onboarding.tsx:150-156` — the track branching Phase 2 deletes; `:356-358` is the jump
  that skips the tutorial.
- `src/i18n.ts:233` — "Finish the sign before this to unlock", the promise the app does not keep.

## Git state snapshot

**Branch:** `main`

**Status:**
```
?? docs/WHY-IT-FEELS-WRONG.md
?? docs/ux-audit-2026-08-01/
```

**Recent commits:**
```
cc99ce3 test(camera): make the 0% grading failure impossible to ship again
2e02496 fix(camera): the mirror trigger was inverted — every letter graded 0%, always
52492df Merge: the coherence pass — 130 defects in the seams between screens
0518894 fix(shots): the screenshot harness was broken by the coherence pass
4ce94b8 docs: plain-language list of every user-visible change in the coherence pass
c27bbc8 fix: 130-defect coherence pass, the seams between screens
46f0cee fix(words): the demo stage now TEACHES footage-less word signs
fbf8afa feat: coach re-derivation for the blended corpus + practice-flow polish
d6f51c4 feat(engine): cross-dataset retrain — camera now graded on two signer populations
cd9b180 fix(words): desktop sheet hung half off-screen — flex-centred dialog wrapper
```

**Diff stat:**
```
(no unstaged changes — the only working-tree entries are the two untracked doc paths above)
```
