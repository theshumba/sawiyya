---
date: 2026-08-01
branch: fix/phase-1-one-road
status: in-progress
---

# Session handoff: Sawiyya Phase 1 "one road" — built, not yet finished

## Resume protocol

1. Read this whole file
2. Run: `git status && git log --oneline -5`
3. Open: `scripts/smoke.mjs`, `src/lesson/unlock.ts`, `docs/ux-audit-2026-08-01/07-THE-PLAN.md`
4. Ask Melusi: "Close out Phase 1's gate, or move to Phase 2?"

> **Scope note:** all work was in-repo, on a new branch off `main`. Working tree is clean;
> everything is committed in `62c8e5a`. **Nothing is pushed and nothing is deployed** —
> `.github/workflows/deploy.yml` fires on push to `main`, so merging IS deploying.
>
> **Variant:** Feature.
>
> Phase 1 came from the plan in `docs/ux-audit-2026-08-01/07-THE-PLAN.md`, which was written
> last session and had NOT been approved. Melusi said "continue", which was taken as go-ahead
> to start Phase 1 (the plan's own first step). Phases 2, 3 and 4 remain unapproved.

## Task state

**What we were doing:** Executing Phase 1 of the UX audit plan — make Home offer one obvious
thing to do, and make the padlocks real. Build is done and committed; the verification gate the
plan set for itself is not.

**Exact next step:** Fix the four failing steps in the rewritten `scripts/smoke.mjs`. They are
selector problems in the new harness, not app failures — each surface passed when reached another
way in the same run. The four: `name → first sign` (line ~78, the `text=I love you` wait races the
FirstSign mount), `deep-linking a locked lesson` (~line 152, `text=Go to your lesson` after a
`page.goto` with a hash change), and the two family steps (~lines 186-210, the `Milk` tile filter
and the `Done` button in FlagPicker). Serve a build with
`cd dist && python3 -m http.server 4173`, then `SMOKE_URL=http://localhost:4173/ node scripts/smoke.mjs`.

**Then, still owed before Phase 1 is done:**
- 390px screenshots in English and Arabic (`npm run shots` — untested this session).
- A plain-language `WHAT-CHANGED` note for Melusi to read before any merge. The plan requires one
  per phase; it was never written.

**Open questions:**
- **The dictionary padlock is arguably theatre.** Phase 1 removed the tap from locked alphabet
  cells per the plan, but free camera practice on any letter is deliberately kept (the Practise
  tab's Alphabet tile reaches all 28). So a padlocked letter in the dictionary is still reachable
  one tab away. Flagged to Melusi, unanswered. Either drop the dictionary lock or accept it as a
  curriculum signal rather than a gate.
- **The content question, open since the coherence audit and now blocking Phase 2 item 7:** the 19
  A1 word signs are all `cameraGradable: false`, so they can be watched but never practised.
  Shrink the promise to an honest Arabic fingerspelling trainer, or chase a Deaf QSL signer for
  real word footage.
- **The mascot.** Fanan the fennec fox is rejected, no replacement direction. He asked to be
  reminded.
- **Is Sawiyya a real product or the Mada demo?** Asked twice across two sessions, never answered.
  The plan assumes real product and says so at its top for him to veto.

**Blockers:** None technical. Phase 2 is blocked on the content question above.

## Reasoning trail

**Decisions made:**
- **One shared lock rule in `src/lesson/unlock.ts`, derived not stored.** `LESSONS` is an ordered
  path; position = index of the first unfinished lesson; before it is done, at it is current,
  after it is locked. Home, `buildDrillQueue`, `LessonPlayer` and the dictionary all read the same
  function, so the padlock cannot drift back into decoration.
- **Node status must come from POSITION, never from a lesson's own signs.** This is what fixes the
  audit's "four Words self-marks complete the fifth trail node on day one": those four signs really
  do reach mastery 2, so any per-lesson check ticks the node. Ordering is the only honest test.
- **"17 camera doors down to 3" was read as three KINDS of door,** since the plan's own wording
  ("the current node's lesson, the Practise tab's Alphabet tile, and a sign's own detail sheet")
  can't be satisfied by three literal call sites without gutting the flag→practise flow. Result:
  every sign-specific route now goes through that sign's detail, which also fixes CameraPractice's
  header lying ("Practise the alphabet") when deep-linked to a word sign. Verified: exactly three
  `name: "camera"` call sites remain outside Onboarding, which Phase 2 owns.
- **Locked stays VISIBLE and disabled, not hidden** — Carroll & Carrithers 1984 and what Duolingo
  does with locked stories. Applied to both the trail node sheet and the dictionary letter cells.
- **Deleted BOTH duplicate Settings rows** (Manage profiles and Privacy policy), though the plan
  named only the first. Same defect class, one line each; leaving one twin standing would be
  arbitrary.
- **Rewrote `scripts/smoke.mjs` rather than patching it.** It was driving three-redesigns-old
  onboarding copy ("Let's begin", a "Daily goal" card on Home) and **every step failed on `main`
  before any Phase 1 change** — verified by building `cc99ce3` into a scratch dir and running it.
  A failing harness looks exactly like one nobody runs. The rewrite drives by role/aria/structure
  so a copy pass (Phase 2 rewrites onboarding entirely) does not silently disarm it again.

**Tried and rejected:**
- **Blocking on the resume protocol's question** ("Start Phase 1, or answer the content question
  first?"). His standing instruction is to pick a sensible default and state it for veto. Phase 1
  is the plan's own first step and is unblocked by every open question.
- **Extending the dictionary lock to the browse grid and search.** Would have made the two surfaces
  consistent, but the plan says "the Dictionary's locked cells", meaning the alphabet grid. Widening
  it is scope creep and makes a dictionary substantially less useful. Flagged the inconsistency
  instead.
- **`vite preview --outDir <absolute path outside root>`** serves nothing. Use `python3 -m
  http.server` from inside the dist dir; the app is hash-routed with `base: "./"` so a plain static
  server is enough.

## Code anchors

- `src/lesson/unlock.ts` — the whole lock. `trailPosition`, `lessonState`, `lessonPlayable`,
  `currentLessonId`. Every other change hangs off this file.
- `src/lesson/unlock.test.ts` — 8 tests pinning the four bypasses shut, including the out-of-order
  completion case at `:82`.
- `scripts/smoke.mjs:78` · `:152` · `:186` — the three regions holding the four failing steps.
- `src/screens/Home.tsx:362-405` — the promoted family-request card, above the trail. Block D
  (241 lines) was deleted from just below this.
- `src/screens/Home.tsx:196-215` — the top-bar stat chips; the gold one now reads
  `xpToday / goalXp` under `homeGoalStat`, not lifetime XP.
- `src/screens/AllSigns.tsx:197-206` — `signUnlocked`, which makes the dictionary's padlocks agree
  with the trail's. The disputed one; see Open questions.
- `src/lesson/curriculum.test.ts:63-73` — `unlockUpTo`, added because the new lock made a word
  lesson unreachable in a test that only wanted to inspect its drill types.
- `docs/ux-audit-2026-08-01/07-THE-PLAN.md:50-101` — Phases 2 and 3, the next work.

## Verification run this session

- `npx tsc -b` — clean.
- `npx vitest run` — 158 passed, 19 files. 8 tests new.
- `npm run build` — green.
- Headless Chromium at 390px, zero console errors, confirmed by hand: today's goal reads `4 / 50`
  in the top bar · no Block D survivors on Home · a locked node's sheet button is `disabled` ·
  `#/lesson/a1-u1-l1` refuses and offers the current lesson · dictionary cells 8+ are padlocked and
  disabled, the 3 edge forms stay open · Settings has one "Manage profiles", zero "Privacy policy",
  and "Not granted yet" is no longer a button · the AI explainer lands on `#/practise`.
- `npm run shots` — **not run.** Owed.

## Git state snapshot

**Branch:** `fix/phase-1-one-road`

**Status:**
```
(clean)
```

**Recent commits:**
```
62c8e5a fix(home): Phase 1 — one road
72abafe docs: the UX journey audit and the four-phase plan
cc99ce3 test(camera): make the 0% grading failure impossible to ship again
2e02496 fix(camera): the mirror trigger was inverted — every letter graded 0%, always
52492df Merge: the coherence pass — 130 defects in the seams between screens
0518894 fix(shots): the screenshot harness was broken by the coherence pass
4ce94b8 docs: plain-language list of every user-visible change in the coherence pass
c27bbc8 fix: 130-defect coherence pass, the seams between screens
46f0cee fix(words): the demo stage now TEACHES footage-less word signs
fbf8afa feat: coach re-derivation for the blended corpus + practice-flow polish
```

**Diff stat:**
```
(no unstaged changes)
```
