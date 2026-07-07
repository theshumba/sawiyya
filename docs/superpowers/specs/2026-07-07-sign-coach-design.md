# Sign Coach — per-finger corrective feedback (2026-07-07)

Approved design (Melusi, 2026-07-07): make camera grading feel like it *sees* your
hand. While practising one of the 28 seeded letters, if the hand is visible but not
matching, the app coaches instead of silently metering: the reference handshape
highlights the one finger that's most wrong (gold) and one short bilingual line says
what to do — "Curl your ring finger" / "اثنِ بنصرك". The instant matching starts,
coaching vanishes and the hold-ring takes over. One finger, one hint, never a list.

## Decision ladder (honesty first)

1. **≥3 fingers clearly off** → "Check the reference" (`coachReference`) — the whole
   shape is wrong; naming one finger would be fake precision.
2. **Worst finger over threshold, with a clear curl/extend direction** (live
   fingertip-to-wrist radius vs the target's) → name that finger + direction.
3. **Off but direction ambiguous (sideways), or everything close** → silence. The
   meter already tells the story. Silence over wrong advice.

**Dropped from the draft design:** "rotate your hand". `normalize.ts` rotation-
canonicalises every frame, so a rotated-but-correct hand *matches anyway* — rotation
can never be the reason a learner is stuck, and hinting it would be dishonest.

## How it works

- **`src/recognizer/coach.ts`** (new, pure): live normalised 42-vec (the exact vector
  the grader already computes) vs the letter's mean handshape from
  `seeds/alphabet-shapes.json` (same normalised space; rescaled once to max radius 1
  to cancel the small averaging shrink). Per-finger error = mean per-joint euclidean
  over the MediaPipe finger groups (same groups as `HandSkeleton`). Constants:
  `FINGER_MIN` deviation gate, `DIRECTION_DELTA` tip-radius gate, `REFERENCE_AT = 3`.
- **`CameraTrainer`**: calls `coach()` on frames it already normalises (no new
  tracking cost), only when `knowsModel` && not matching. A hint must be stable for
  ~700 ms before it shows (no flicker); it clears *immediately* on match / hand lost.
  State updates only when the advice actually changes (Q1 pattern).
- **`HandSkeleton`**: optional `coachFinger` prop tints that finger's core gold
  (#E6B24C) and draws it last (on top). Undefined elsewhere → zero visual change.
- **i18n**: 11 new keys (5 fingers × curl/extend + `coachReference`), EN + AR,
  masculine imperative matching the app's existing register; AR strings logged in
  `docs/ARABIC-PROOFREAD.md` for the native review pass.

## Guardrails

- Coach runs ONLY where a real target exists (the 28 seeded letters) — never for
  watch-only signs, never from taught KNN samples.
- Thresholds conservative; every ambiguous case resolves to silence.
- Not added to the aria-live region (M19 keeps ONE live region; coaching is visual
  supplementary text and must not spam screen readers).

## Testing

`coach.test.ts`, data-driven from the real shapes: every letter's own mean shape
(passed through the real `normalizeLandmarks` pipeline) coaches **null** (the big
honesty test); programmatically curling a clearly-extended finger yields that finger
+ "extend" (and vice versa); curling everything yields `reference`; small jitter
stays silent. Existing suite + tsc + build stay green.

## Follow-up (separate step, owner-gated)

Phase B accuracy retrain: Melusi downloads ArSL21L
(`data.mendeley.com/datasets/8hrn3bvdvk/1`, CC BY 4.0), then the existing harness
merges → retrains → recalibrates with honest cross-dataset numbers.
