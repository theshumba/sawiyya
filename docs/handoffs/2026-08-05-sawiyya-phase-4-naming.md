---
date: 2026-08-05
branch: feat/phase-4-say-what-things-are
status: in-progress
---

# Session handoff: Phases 1–3 merged and LIVE; Phase 4 built and gated, awaiting his eyes

## Resume protocol

1. Read this whole file
2. Run: `git status && git log --oneline -5`
3. Open: `docs/WHAT-CHANGED-phase-4-say-what-things-are.md`, `src/screens/Progress.tsx:160`,
   `src/i18n.tone.test.ts`
4. Walk him through Phase 4 against `~/Desktop/sawiyya-phase-4-shots/` (51), then ask whether it
   merges. **Merging deploys it.**

> **Scope note:** all work was in-repo and is committed. Working tree is clean.
> **Variant:** Feature.
>
> **`main` is at `7196fcd` and IS deployed** — Phases 1, 2 and 3 went live this session
> (theshumba.github.io/sawiyya, Pages run `31020818862`, live bundle fetched and confirmed).
> Phase 4 sits unmerged on `feat/phase-4-say-what-things-are` (`9f72ebf`).
> `.github/workflows/deploy.yml` fires on push to `main`, so **merging IS deploying**.

## Task state

**What we were doing:** Resumed the Phase 3 handoff, reviewed all three phases with him, merged them
in stack order and verified the live app changed. He then said "build phase 4". Phase 4 "Say what
things are" is built, tested, gated and committed. Nothing has been said about merging it.

**Exact next step:** Nothing is half-done. Walk him through Phase 4 using
`docs/WHAT-CHANGED-phase-4-say-what-things-are.md` as the script and
`~/Desktop/sawiyya-phase-4-shots/` (compare `en-home.png`, `en-progress.png`, `en-dictionary.png`,
`en-dictionary-words.png` against the same names in `~/Desktop/sawiyya-phase-3-shots/`). Then ask
whether it merges, and if he says yes: `git checkout main && git merge --ff-only
feat/phase-4-say-what-things-are && git push origin main`, watch the run with `gh run watch`, and
verify the LIVE bundle carries "Your road, one lesson at a time" and no longer carries "Your oasis".

**Open questions:**
- **The 19 A1 word signs are `cameraGradable: false`** — watchable, never practisable. Phase 4
  merged them into the dictionary, which tidied the naming and did NOT solve the content. Six
  sessions old. The four-phase plan is finished, so this is now the biggest thing in the way.
- **The mascot** — Fanan rejected, no replacement chosen, still on three setup screens and beside the
  current lesson node. He has been reminded twice and has not acted.
- **The dictionary padlock may be theatre** — free camera practice on all 28 letters is one tab away.
  Raised in Phase 1, unanswered.
- **Is Sawiyya a real product or the Mada demo?** Asked across six sessions, never answered.
- **41 unused i18n keys** left in place deliberately (celebration screens never built, Home cards
  Phase 1 deleted, the free-camera tile). Invisible to a learner; a deliberate deletion pass is its
  own job.

**Blockers:** None. The plan is complete; anything after this is new work, not the plan.

## Reasoning trail

**Decisions made:**
- **Progress lost its tabs entirely rather than keeping three dead ends.** The plan said "cut or fix
  the three tabs that have no action". Fixing them meant inventing actions; one screen that reads top
  to bottom is what a readout is. It also kills the header that renamed itself four times.
- **The Family league tab was deleted, not moved.** It ranked the same household the Family tab
  lists, from inside a screen hidden behind the learner's own avatar, and its empty state linked to
  Family. The audit named it a collision (finding f).
- **The solo hint moved to Family, and its ID is frozen.** `place` is now `household-solo`, but
  `id` stays `hint-progress-league` because `seen` is keyed by id — renaming it would re-show the
  hint to everyone who already met it, and Phase 3 is live.
- **"Dictionary", not "Signs".** The Arabic already said القاموس, the screen holds the alphabet and
  the words, and it has search. Every door says it now: tab, screen title, Settings row, camera
  escape hatch, onboarding recap.
- **`#/words` survives the merge.** It is in the screenshot harness and anyone who bookmarked the
  word room has it, so `hashToScreen` maps it to `{allSigns, filter:"words"}` and back.
- **One/two-handed became a TAG, not a section.** The deleted Words screen sorted by it because you
  can copy a one-handed sign while holding the phone. That is real information about doing the sign.
- **The tone rules are a test, not a memory** (`src/i18n.tone.test.ts`). Conventions in the key names
  (`*Cta`, `*Title`) carry the rules, plus an explicit allowlist of keys permitted to use "!". It
  caught `celConnectTitle` on its first run.
- **Home's chip row became the Progress door.** Adding a card under the trail would restore the first
  card of the stack Phase 1 deleted; the three numbers ARE the summary of Progress, so they open it.

**Tried and rejected:**
- **Deleting all 43 unused i18n keys.** Two were orphaned by this phase and are gone; the other 41
  predate it. Quietly widening a naming phase into a copy purge is not the ask.
- **A blanket "digits under ten" test.** "one" appears constantly as a pronoun ("One hand", "one at a
  time"), so the gate would be noise. Applied the rule by hand where the word was a count.
- **Leaving Playwright's 30s default timeout.** A broken build took twelve minutes to finish
  reporting itself, which is long enough that you stop running the harness. Now 8s.

## Code anchors

- `src/screens/Progress.tsx:160` — the rebuilt readout's render. No tab state; sections in the order
  a learner asks the questions. `StatGrid`, `MonthHeat`, `OasisScene`, `Achievements`, `ComingUp`
  below it are what the four tabs became.
- `src/store/ui.ts:25` — `allSigns` gained `filter?: "words"`; `screenToHash`/`hashToScreen` keep
  `#/words` alive as the filtered dictionary.
- `src/screens/AllSigns.tsx:112` — `initialFilter`, and the effect that scrolls the applied chip into
  view (arriving pre-filtered, the chip started off-screen on a phone).
- `src/i18n.tone.test.ts` — the tone gate. Add a key that breaks a rule and this fails.
- `src/journey/journey.ts:192` — `HintPlace`, where `progress-league` became `household-solo` with
  the id frozen.
- `src/screens/Home.tsx:395` — the stat-chip button (the Progress door) and, below it, the visible
  `#trail-title` heading.
- `scripts/smoke.mjs:115` — the recap step, now driving before judging. This is the harness fault
  that made the first pre-Phase-4 verification run meaningless: one wrong word stranded the run and
  36 later steps failed for unrelated reasons.
- `docs/ux-audit-2026-08-01/07-THE-PLAN.md:102` — Phase 4 as specified. All four phases now built.

## Verification run this session

- **Phases 1–3:** re-ran `npx tsc -b` and `npx vitest run` (214/22) before merging · fast-forwarded
  `main` `cc99ce3` → `7196fcd` in stack order · pushed · Pages run `31020818862` green · **live JS
  bundle fetched** and confirmed to carry "Getting started", "Keep your progress", "Today is one of
  your practice days" and to no longer carry "What do you want to learn" or "SPECIAL PATH".
- **Phase 4:** `npx tsc -b` clean · `npx vitest run` **224 passed, 24 files** (was 214/22) ·
  `npm run build` green · `node scripts/smoke.mjs` **40/40**, 8 new, no unexpected console errors ·
  `npm run shots` 51 shots, clean console on every screen.
- **The nine new gates were re-run against `7196fcd`** via `git worktree add --detach`, symlinked
  `node_modules`, `npx vite build`, `python3 -m http.server`. Every one fails there; every Phase 1, 2
  and 3 step still passes. Worktree removed.
- Serving a build: `cd dist && python3 -m http.server 4173`, then `SMOKE_URL=http://localhost:4173/
  node scripts/smoke.mjs`. Start the server as a BACKGROUND task — a `( … &)` subshell gets killed
  with the tool call and the smoke run then hangs against a dead port.

## Git state snapshot

**Branch:** `feat/phase-4-say-what-things-are`

**Status:**
```
(clean)
```

**Recent commits:**
```
9f72ebf feat(naming): Phase 4 — say what things are
7196fcd docs: the Phase 3 session handoff
68b85d2 feat(journey): Phase 3 — stages
bed9703 docs: the Phase 2 session handoff, left untracked last session
9ab4347 feat(onboarding): Phase 2 — one first run
c8b8d66 fix(smoke): close Phase 1's gate — the four failing steps were the harness
62c8e5a fix(home): Phase 1 — one road
72abafe docs: the UX journey audit and the four-phase plan
cc99ce3 test(camera): make the 0% grading failure impossible to ship again
2e02496 fix(camera): the mirror trigger was inverted — every letter graded 0%, always
```

**Diff stat:**
```
(no unstaged changes)
```
