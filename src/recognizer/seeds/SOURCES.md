# Seed Data Attribution

The file `alphabet.json` in this directory was derived from the **Arabic Sign Language (ArSL) Dataset** published on Zenodo (record 18363162). License: **CC-BY-4.0**. Downloaded 2026-06-24.

**Extraction method:** Raw 21-point MediaPipe landmark coordinates (right-hand, columns `x0,y0,...,x20,y20` from the semicolon-delimited CSV) were fed through Sawiyya's own `normalizeLandmarks(lms, mirror=false)` function (`src/recognizer/normalize.ts`), producing 42-dimensional normalised feature vectors. Up to 40 evenly-spaced vectors were retained per class, covering the 28 Arabic letter signs mapped in the dataset. Three additional letter classes (`alpha-taMarbuta`, `alpha-laa`, `alpha-al`) are not present in the source dataset and remain teach-mode only (no seeds). Control signs (`Delete`, `Finish`, `Space`) were discarded.

**Regenerated 2026-06-27** after `normalizeLandmarks` gained **rotation-invariant** canonicalisation (the wrist→middle-knuckle axis is aligned before scaling). This removed the brittleness where a correctly-shaped hand held ~15–20° off the dataset's pose fell outside the KNN distance gate and stuck the confidence meter at 0% — hit by users whose natural hand tilt differed from the source signers (nothing here reads skin colour; landmarks are pure geometry). Seeds must be regenerated with `extract.ts` (and the gate re-checked with `calibrate.ts`) whenever the normaliser changes, since live frames and seeds must share one feature space. Post-fix held-out calibration: gate=0.65, tau=0.70 → TA=98.1%, FA=0.2%.

**Citation:**
> Arabic Sign Language (ArSL) Dataset. Zenodo. <https://zenodo.org/record/18363162>. CC-BY-4.0.
