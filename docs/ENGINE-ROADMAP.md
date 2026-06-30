# Sawiyya — Engine & Flow Roadmap (2026-06-30)

Goal (Melusi): make the **camera recognition engine genuinely good** (incorporating the shared GitHub repos), and make the app **practice-first** — start learning → straight into camera practice. Keep the existing app; no Stitch redesign.

## 2026-06-30 session — what shipped (real numbers)
- **Phase A — MLP wired into the LIVE grader.** `CameraTrainer` now grades the 28 seeded
  letters with the trained MLP (`gradeWithModel`, `src/recognizer/classifier.ts`) as the
  primary signal; KNN stays the fallback for teach-mode / un-seeded signs. Retrained:
  held-out **98.7%**; calibrated live threshold **tau=0.5 → TA 98.2% / FA 0.05%**
  (within-dataset) emitted into `alphabet-model.json` by `train.ts`, read as `MODEL_TAU`.
  Combined with the existing 24-frame hold (>1s) for the confirm gate. Left-hand mirror +
  rotation already handled in `normalize.ts` and shared by seeds + live frames, so the MLP
  is drop-in. Tests: `classifier.test.ts` (+gradeWithModel match/reject/empty).
- **28-vs-"32" fixed.** Only 28 letters have ground-truth seeds; the 3 edge forms
  (`taMarbuta/laa/al`) are now `cameraGradable:false` (reference only) and the stale "32"
  comments/copy corrected.
- **Phase C — emoji killed, real hands shown.** `HandSkeleton` draws the **mean 21-point
  MediaPipe handshape per letter** from the real seed geometry (`handshapes.ts` →
  `alphabet-shapes.json`) — verified visually (recognisable hands). Used in `SignGlyph`,
  `SignDemo` (hero + honest "real signer handshape" caption), and the `CameraTrainer`
  reference chip. Word signs (no data) → honest sign icon, never a fake emoji-as-sign.
- **Phase B — harness built, data owner-gated.** `landmarks_from_images.py` runs MediaPipe
  offline → CSV in the existing schema; full runbook in `docs/PHASE-B-DATA.md`. NOT run:
  datasets aren't on disk AND **AASL license is disputed (Kaggle shows CC BY-NC-SA, not the
  brief's CC BY-SA)** — confirm before use. ArSL21L (CC BY 4.0) is the clean path.
- **Phase D — motion capability landed (engine only).** `src/recognizer/pointHistory.ts`:
  a frame ring-buffer + the kinivi normalised sequence feature (ready for a GRU/1D-CNN via
  onnxruntime-web) + a transparent geometric motion recogniser (static / swipe direction /
  circular), 10 passing tests on synthetic trajectories. HONEST: it does NOT grade QSL
  words — no public QSL isolated-sign dataset exists, so real motion-word recognition still
  needs a native signer to record sequences (which this feature then trains).
- **Phase E — practice-first flow pass (sub-agent, audit-driven).** Shared `NoProfileFallback`
  replaces every blank `return null` dead end; LessonPlayer keeps close-to-home chrome +
  "nothing due → practise" CTA; the dominant CTAs (Home START, onboarding Alphabet card,
  Progress "keep building"/review, InfoPages, review cards) now deep-link into camera via
  `go({name:'camera', targetSignId})` with the `cameraGradable` gate; inert sign widgets are
  tappable → camera; blank empty states became helpful camera-CTA cards; bilingual bugs
  fixed (InfoPages duplicated-Arabic, "32"→"28", Settings hand cards, double-printed Arabic).
  Verified: tsc + build + 23 tests green; headless render smoke (Home/dictionary/camera) clean.
- **Emoji purge.** Sign visuals now flow through `SignGlyph` (the single source of truth):
  alphabet → real skeleton, `iloveyou` → brand hand image, un-recorded words → honest sign
  icon. Consolidated the dictionary (`AllSigns`) + lesson surfaces that previously rendered
  `sign.emoji` directly (this also fixed `iloveyou` showing a 🤟 emoji instead of its image).
  Hardened `ProgressRing` against a NaN ratio (new-user 0/0 goal).

## Honest follow-ups (not done, by design)
- **Phase B data** is owner-gated: download ArSL21L (CC BY 4.0) and run the built
  `landmarks_from_images.py`; CONFIRM AASL's license first (Kaggle shows CC BY-NC-SA — NC
  would block us). Full runbook: `docs/PHASE-B-DATA.md`.
- A live in-app **motion-sign demo** waits on recorded QSL motion sequences (engine is ready).
- A few **tiny inline emoji** remain only in two bespoke dense visualisations (Progress
  "constellation" nodes, Family honeycomb/pills) where alphabet already shows the real letter
  and a hand skeleton would be illegible at that scale — left as a deliberate, owner-decidable
  call rather than a uniform icon wall.
- Cosmetic Arabic plural-grammar + Western-digit localisation deferred (flagged in audit).

## Where we are today (verified in code)
- Pipeline: MediaPipe `tasks-vision` HandLandmarker → `normalizeLandmarks()` (42-dim, rotation-invariant) → **KNN** with distance gate (`src/recognizer/`).
- **Alphabet = real**: 28 letters seeded from the Zenodo ArSL dataset (`seeds/alphabet.json`, CC-BY-4.0), gate 0.65 / tau 0.70, TA≈98% / FA 0.2% (within-dataset). These grade genuinely.
- **Everyday signs = fake-feeling**: no dataset → `CameraTrainer` falls back to **teach mode** (you record your own hand, then it confirms you match *yourself*).
- **Visuals = placeholders**: `SignGlyph` / `SignDemo` show the Arabic *letter* or an *emoji* — never a real hand. (Code comments: "Phase-2 swaps in Deaf-signer video.")

## The plan

### Phase 1 — Practice-first flow ✅ (started)
- [x] Practise tab → opens the camera directly (alpha-alif, real grade mode + letter switcher) instead of the chooser. (`AppNav.tsx`)
- [ ] Optionally make "start a lesson" / Home primary CTA land on camera too.

### Phase 2 — Better engine (incorporate the repos)
Upgrade KNN → a **trained classifier**, the `kinivi/hand-gesture-recognition-mediapipe` approach (its `keypoint_classifier` is a small MLP on normalized 21-pt landmarks — exactly our 42-dim vectors).
1. **Train offline** on the real seed vectors (`alphabet.json`) → a small MLP/softmax. Tooling: extend `tools/extract-seeds/` with `train.ts` (pure TS gradient descent, no Python) → emit `seeds/alphabet-model.json` (weights).
2. **Run in-browser**: either pure-JS forward pass, or export to ONNX and run via **`onnxruntime-web`** (the `PINTO0309/hand-gesture-recognition-using-onnx` path; MIT, ~2M weekly downloads). Add as a dep.
3. **Keep KNN as fallback** for un-trained/teach-mode classes — no regression risk; A/B the two on the held-out split with `calibrate.ts`.
4. **Expand real data / more people** (better cross-person accuracy): run MediaPipe offline over **AASL (CC BY-SA 4.0)** + **ArSL21L (CC BY 4.0)** images → more vectors per letter, more signers. Ship only derived landmarks (raw images never bundled).
5. **Motion signs**: add `kinivi`'s **point-history classifier** pattern — buffer N frames of landmarks → tiny sequence model (GRU/1D-CNN via onnxruntime-web) → recognize signs that need movement. (Still needs recorded data for QSL words, but the engine capability lands here.)

### Phase 3 — Real sign visuals (kill the emoji)
- Alphabet: add a clean **handshape reference image per letter** (from the CC datasets) so you SEE the hand in `SignDemo`/`SignGlyph`, not just the glyph.
- Everyday signs: honest path = record a small set with a Deaf signer (or an avatar). Until then, mark them clearly as teach/practice, not auto-graded.

### Repo → role map
| Repo | Role |
|---|---|
| google-ai-edge/mediapipe | HandLandmarker (already in) |
| kinivi/hand-gesture-recognition-mediapipe | MLP keypoint classifier + point-history (motion) blueprint |
| PINTO0309/hand-gesture-recognition-using-onnx | onnxruntime-web inference path |
| AASL / ArSL2018 / ArSL21L datasets | more real training data, more signers |
| (sign-language-translator, sign.mt, signlanguageavatar) | future Type-to-Sign / avatar, not the recognizer |

Full repo list: `~/Desktop/Projects/Sawiyya/Sawiyya/Sawiyya - 13 GitHub Repo Master List.md`.

## Honest constraints
- No public **QSL isolated-sign** dataset exists → real everyday-sign grading/videos need recording a native signer. The engine work makes the *alphabet* excellent and gives us the *capability* for words; the *data* for QSL words is a real-world step.
