# Letter reference photos — provenance

One real signer photo per Arabic letter (28 seeded letters + the 3 edge forms
ة / لا / ال), shown as the primary sign demonstration across the app.

- **Dataset:** ArSL21L: Arabic Sign Language Letter Dataset
- **Citation:** Gochoo, Munkhjargal (2022), "ArSL21L: Arabic Sign Language
  Letter Dataset", Mendeley Data, v1, doi:10.17632/8hrn3bvdvk.1
- **License:** CC BY 4.0 (verified on the Mendeley dataset page, 2026-07-31).
  Attribution is shown in-app on the AI transparency page; images are modified
  (cropped square to the labelled hand bounding box, resized to 384px, WebP).
- **Selection:** for each letter, candidates were scored by (a) distance of
  their MediaPipe landmarks — normalised exactly like `src/recognizer/
  normalize.ts` — to that letter's mean shape in `src/recognizer/seeds/
  alphabet-shapes.json`, so the photo agrees with what the camera grader
  expects, and (b) sharpness / brightness / hand-size gates, then approved
  visually. Per-file provenance in `manifest.json` (source dataset filename +
  distance + sharpness).
- **Regenerate:** the pipeline lives in the session scratchpad scripts
  `pick_photos.py` / `finalize_photos.py` (2026-07-31); dataset download is the
  single `data.zip` from the Mendeley page.

Class-name mapping notes: the dataset's `yaa` class is ي (its `ya` class is a
different letter form whose landmarks sit ~1.05 from our ي mean vs 0.17 for
`yaa`); `toot` = ة, `al` = ال, `la` = لا, `taa` = ط, `dha` = ظ, `haa` = ح,
`ha` = ه.
