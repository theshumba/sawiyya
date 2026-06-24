# Seed Data Attribution

The file `alphabet.json` in this directory was derived from the **Arabic Sign Language (ArSL) Dataset** published on Zenodo (record 18363162). License: **CC-BY-4.0**. Downloaded 2026-06-24.

**Extraction method:** Raw 21-point MediaPipe landmark coordinates (right-hand, columns `x0,y0,...,x20,y20` from the semicolon-delimited CSV) were fed through Sawiyya's own `normalizeLandmarks(lms, mirror=false)` function (`src/recognizer/normalize.ts`), producing 42-dimensional normalised feature vectors. Up to 40 evenly-spaced vectors were retained per class, covering the 28 Arabic letter signs mapped in the dataset. Three additional letter classes (`alpha-taMarbuta`, `alpha-laa`, `alpha-al`) are not present in the source dataset and remain teach-mode only (no seeds). Control signs (`Delete`, `Finish`, `Space`) were discarded.

**Citation:**
> Arabic Sign Language (ArSL) Dataset. Zenodo. <https://zenodo.org/record/18363162>. CC-BY-4.0.
