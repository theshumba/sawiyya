---
date: 2026-08-01
branch: main
status: in-progress
---

# Session handoff: real signer photos, Words hub, Latin fingerspell, cross-dataset camera retrain — all LIVE

## Resume protocol

1. Read this whole file
2. Run: `git status && git log --oneline -6` (the six commits 65e6f74..46f0cee ARE this session; their bodies carry most rationale)
3. Open: `docs/RECORD-WORD-SIGNS.md`, `src/recognizer/seeds/SOURCES.md`, `src/content/signs.ts`
4. Ask the user: "Do you have the 19 word-sign clips to wire in, or should I pick up one of the open follow-ups?"

> **Scope note:** all session work is in-repo and COMMITTED + DEPLOYED (working
> tree clean). Everything below the fold is live at theshumba.github.io/sawiyya
> — verified against the served bundles, including the retrained model weights
> (digit-run grep; see gotchas).
> **Variant:** Feature.

## Task state

**What we were doing:** Owner reported the averaged-skeleton "blob hands", a dead fingerspell (Latin input all skipped), no instant word practice, and spacing bugs → shipped real ArSL21L photos for all 31 letters, a Words hub, Latin→Arabic fingerspell + on-screen keypad, then "improve as much as you can" → executed the Phase-B cross-dataset camera retrain (old model: 67.0% on unseen-dataset signers; blended: 93.6% there / 99.3% Zenodo / tau 0.5), re-derived Sign-Coach thresholds, flow polish, and made footage-less word demos teach (his "Bedtime is broken" report).

**Exact next step:** Owner-gated — nothing code-side is in flight. When Melusi delivers the 19 word clips (kit: `docs/RECORD-WORD-SIGNS.md`), drop them in `public/signs/<id>.webm` and add `media: { type: "video", src: "signs/<id>.webm", signer: "reference" }` per sign in `src/content/signs.ts` (recognise drills upgrade automatically via `hasVisual`).

**Open questions:**
- Does the LANDING repo (`~/Desktop/Projects/sawiyya-landing`, separate from this app repo) still quote pre-retrain accuracy claims (~97-99%)? Not checked this session — worth a grep before anyone cites numbers.
- Old owner ledger still open: wife's Arabic proofread (docs/ARABIC-PROOFREAD.md grew three sections this session), live phone `?debug` camera test, H17 mirror decision.

**Blockers:** None code-side; word footage + proofread are owner actions.

## Reasoning trail

**Decisions made** (commit bodies carry the rest — these are the ones you'd otherwise re-derive):

- **Photo selection scored against the model's own mean shapes** (normalize.ts frame, min over both mirrors) — guarantees the displayed photo and the camera grader agree, and it *empirically settled the dataset label trap*: ArSL21L's `yaa` = ي (d 0.17), its `ya` is NOT (d 1.05, nearest lam); `taa`=ط, `dha`=ظ, `toot`=ة, `haa`=ح, `ha`=ه. Map lives in `tools/extract-seeds/arsl21l_labels.json`.
- **Chirality snap before any cross-dataset number** — 3,532/4,480 ArSL21L samples are mirror captures (no handedness column); each sample keeps the reflection nearer its Zenodo class centroid. Without it the cross-dataset baseline reads a fake 21% instead of the true 67%.
- **Coach FINGER_MIN 0.24, not 0.26** — 0.26 (p92) was tried first and is too deaf: a fully-curled-finger miss produces ~0.25. 0.24 = correct-hand p90 AND catches the canonical miss; the direction gate (0.17) is the second filter.
- **Single blended coach mean, not per-population variants** — measured: own-population worst-finger p90 is still 0.206 (ArSL21L is inherently noisy), so variants don't restore old precision; not worth the schema change.
- **`media.signer` drives the footage label** — only `"deaf"` may claim "Deaf signer recording"; absent/other → "Reference recording". Owner (hearing) can record without the app lying.
- **Words self-mark rates `'hard'`** (H2: nothing confirmed it) — words cap at mastery 2 by design; the M4 camera gate is untouched.

**Tried and rejected:**
- **Any shippable word-sign video source** — KArSL / Jumla / research corpora are all research-only or NC; recording is the only legal path. Do not re-propose dataset video for words.
- **AI-generated hand illustrations for words** — fails the honesty bar (app previously retired an AI "signer" photo); text-instruction stage instead.
- **Centering the Words dialog with `-translate-x/y-1/2`** — `animate-rise` keyframes pin `transform` (fill both) and silently cancel translate utilities; flex-centred wrapper is the pattern.

**Session gotchas a fresh agent will hit (not in commit messages):**
- **Vite tree-shakes unused JSON fields** — `sourceAccs`/`testAcc` never reach bundles; to verify a live model, grep a weight's digit run (e.g. from `alphabet-model.json` W1[0][0]) in the served chunk.
- **Icon font is SUBSETTED** (public/fonts/SOURCES.md) — a new `Icon name` renders as raw text; reuse existing glyph names.
- **CI runs FRESH tsc** — `node:fs` imports in test files pass locally (incremental cache) but fail CI; use `import.meta.glob`.
- **Headless-drive harness:** onboarding walks by clicking the bottom-most visible button per step (footer CTA); `settle()` must cap image waits (lazy offscreen imgs never complete → fullPage hangs).
- **Dataset reproducibility:** `tools/extract-seeds/dataset/arsl21l/` is a SYMLINK tree into the session scratchpad (now gone) — the derived `arsl21l_landmarks.csv` + `corpus.json` are real files and survive; to re-extract images, re-download the single `data.zip` (845MB, unauthenticated) from Mendeley `8hrn3bvdvk` and re-link.

## Code anchors

- `src/content/signs.ts:86` — `hands: 1|2` param; `:250` FOLDS; `:299` `transliterateLatin` (Latin→Arabic fingerspell)
- `src/components/SignDemo.tsx:12` — `demoShowsHint()`; the demo-stage branching (media → photo → iloveyou → skeleton → instruction stage)
- `src/components/SignGlyph.tsx` — THE single switch for how any sign renders (photo branch first)
- `src/recognizer/coach.ts:46-47` — re-derived thresholds + full derivation comment
- `tools/extract-seeds/extract.ts:152` — chirality snap; blended 20+20 seeds; corpus emission
- `tools/extract-seeds/train.ts` — corpus mode, Zenodo-only baseline BEFORE blend, tau calibration
- `docs/RECORD-WORD-SIGNS.md` — the 19-clip owner recording kit (the last content hole)
- `src/screens/Words.tsx` — Words hub + flex-centred sheet dialog

## Git state snapshot

**Branch:** `main`

**Status:**
```
(clean)
```

**Recent commits:**
```
46f0cee fix(words): the demo stage now TEACHES footage-less word signs
fbf8afa feat: coach re-derivation for the blended corpus + practice-flow polish
d6f51c4 feat(engine): cross-dataset retrain — camera now graded on two signer populations
cd9b180 fix(words): desktop sheet hung half off-screen — flex-centred dialog wrapper
05d755d fix(test): photo-existence gate via import.meta.glob — CI tsc has no node types
65e6f74 feat: real signer photos everywhere, Words hub, Latin fingerspell, practise hub tab
9263ceb feat(coach): Sign Coach — per-finger corrective hints while not matching
74eb550 docs(spec): Sign Coach — per-finger corrective feedback design
26b8b63 fix(content): demote iloveyou/stop to watch-only — kill circular teach-then-match
771db0f Merge feat/fable5-overhaul: full Fable-5 overhaul (audit batches 1-8, Steps 0-6)
```

**Diff stat:**
```
(no unstaged changes)
```
