# Seed Data Attribution

The file `alphabet.json` in this directory was derived from the **Arabic Sign Language (ArSL) Dataset** published on Zenodo (record 18363162). License: **CC-BY-4.0**. Downloaded 2026-06-24.

**Extraction method:** Raw 21-point MediaPipe landmark coordinates (right-hand, columns `x0,y0,...,x20,y20` from the semicolon-delimited CSV) were fed through Sawiyya's own `normalizeLandmarks(lms, mirror=false)` function (`src/recognizer/normalize.ts`), producing 42-dimensional normalised feature vectors. Up to 40 evenly-spaced vectors were retained per class, covering the 28 Arabic letter signs mapped in the dataset. Three additional letter classes (`alpha-taMarbuta`, `alpha-laa`, `alpha-al`) are not present in the source dataset and remain teach-mode only (no seeds). Control signs (`Delete`, `Finish`, `Space`) were discarded.

**Regenerated 2026-06-27** after `normalizeLandmarks` gained **rotation-invariant** canonicalisation (the wrist→middle-knuckle axis is aligned before scaling). This removed the brittleness where a correctly-shaped hand held ~15–20° off the dataset's pose fell outside the KNN distance gate and stuck the confidence meter at 0% — hit by users whose natural hand tilt differed from the source signers (nothing here reads skin colour; landmarks are pure geometry). Seeds must be regenerated with `extract.ts` (and the gate re-checked with `calibrate.ts`) whenever the normaliser changes, since live frames and seeds must share one feature space. Post-fix held-out calibration: gate=0.65, tau=0.70 → TA=98.1%, FA=0.2%.

**Regenerated 2026-08-01 — Phase B cross-dataset blend.** A second, independent
signer population was added: **ArSL21L** (Gochoo, M., 2022 — Mendeley Data
`8hrn3bvdvk` v1, CC BY 4.0; 14,202 photos, 50 signers), landmarked offline with
`landmarks_from_images.py` against the SAME vendored HandLandmarker model the
app ships. Seeds now blend **20 Zenodo + 20 ArSL21L vectors per class** (same
shipped size, double the signer diversity); `alphabet-shapes.json` means and the
MLP (`alphabet-model.json`) were regenerated from the two-source corpus.
ArSL21L samples are **chirality-snapped**: the CSV has no handedness column and
3,532/4,480 samples were mirror-captures, so each sample keeps whichever
reflection lies nearer its Zenodo class centroid (the live camera mirrors left
hands into the same single-chirality space, §6.8).
Honest numbers (per-source 80/20 held-out): the old Zenodo-only model scored
**67.0%** on ArSL21L held-out (cross-dataset — the number that matches "works
for some people, not others"); the blended model scores **99.3% (Zenodo) /
93.6% (ArSL21L) / 96.5% blended**, calibrated tau=0.5 → TA 96.3%, FA 0.12%.
KNN gate re-validated on the blended store: gate=0.65 tau=0.70 → TA 97.1%,
FA 0.2%. All data-driven tests (coach honesty, classifier, KNN) pass unchanged.

**Citation:**
> Arabic Sign Language (ArSL) Dataset. Zenodo. <https://zenodo.org/record/18363162>. CC-BY-4.0.
> Gochoo, Munkhjargal (2022). ArSL21L: Arabic Sign Language Letter Dataset. Mendeley Data, v1. <https://doi.org/10.17632/8hrn3bvdvk.1>. CC BY 4.0.
