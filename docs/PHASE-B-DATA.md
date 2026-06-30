# Phase B — More real data (more signers) for the alphabet model

**Status: real-world step, owner-gated. Harness is built; the data is not yet on disk.**

## Why
The shipped seeds come from a **single** dataset (Zenodo ArSL landmark CSV, CC-BY-4.0).
Our held-out accuracy (~98.7%) is **within-dataset** — it does not measure how well the
model generalises to *new people* whose hands the dataset never saw. Adding a second,
independent set of signers is the single biggest lever on real-world (cross-person)
accuracy. The engine work (MLP, calibration, visuals) is done; this is the data step.

## What's blocking it (honest)
1. **Neither candidate dataset is on disk**, and the brief forbids pulling multi-GB
   image sets into this environment. Both need a manual download by the owner.
2. **AASL license is disputed.** The brief assumed CC BY-SA 4.0, but the live Kaggle
   listing shows **CC BY-NC-SA 4.0** (NonCommercial) while the arXiv paper says CC BY 4.0.
   NonCommercial **propagates to derived landmarks** and would block Sawiyya (a commercial
   product) — you cannot launder an NC dataset by reducing it to geometry. **Confirm the
   real license with the dataset owner / Kaggle (logged in) BEFORE using AASL.**

## Recommended path: ArSL21L first (clean license)
| Dataset | Host | Size | License | Verdict |
|---|---|---|---|---|
| **ArSL21L** | Mendeley `data.mendeley.com/datasets/8hrn3bvdvk/1` (the GitHub MoyoG/ArSL21L repo is **code only, no images**) | 14,202 imgs, 32 classes, 50 signers, bbox-annotated | **CC BY 4.0 (confirmed)** | ✅ use — attribution required |
| **AASL** | Kaggle `muhammadalbrham/rgb-arabic-alphabets-sign-language-dataset` | 7,857 imgs, 200+ signers, ~31 classes | **DISPUTED — possibly CC BY-NC-SA** | ⚠️ confirm license first |
| KArSL / JUMLA / ArabSign | — | — | NC / research-only | ❌ reference only, never shipped |

The MLP/normalise pipeline avoids GPL; keep all NC datasets reference-only.

## Runbook (owner's machine — a real-world step)
```bash
# 0. (AASL only) CONFIRM license is NOT NonCommercial. If NC -> skip AASL entirely.

# 1. download ArSL21L from Mendeley into an IGNORED folder (never commit images)
mkdir -p tools/extract-seeds/dataset/arsl21l
#   ...unzip the Mendeley download here, arranged as per-class subfolders...
echo "tools/extract-seeds/dataset/arsl21l/" >> .gitignore   # if not already ignored

# 2. MediaPipe in a venv (keeps system python clean; arm64 wheels exist for py3.9)
python3 -m venv .venv && source .venv/bin/activate
pip install --upgrade pip && pip install mediapipe opencv-python numpy

# 3. write the label map: raw ArSL21L folder name -> our alpha-* id (see extract.ts
#    LABEL_MAP for the 28 target ids). Save as tools/extract-seeds/arsl21l_labels.json
#    e.g. {"Alef":"alpha-alif","Beh":"alpha-ba",..., "someVariant": null}

# 4. derive landmarks (images -> CSV in the ArSL_dataset.csv schema)
python3 tools/extract-seeds/landmarks_from_images.py \
  --images tools/extract-seeds/dataset/arsl21l \
  --out    tools/extract-seeds/dataset/arsl21l_landmarks.csv \
  --label-map tools/extract-seeds/arsl21l_labels.json \
  --max-per-class 120

# 5. fold the new CSV into extract.ts's input (merge rows or read both files), then:
npx tsx tools/extract-seeds/extract.ts     # rebuild seeds/alphabet.json (now 2 sources)
npx tsx tools/extract-seeds/handshapes.ts  # refresh the reference handshapes
npx tsx tools/extract-seeds/calibrate.ts   # re-check KNN gate/tau (now cross-person!)
npx tsx tools/extract-seeds/train.ts       # retrain MLP + recalibrate model tau

# 6. update src/recognizer/seeds/SOURCES.md attribution (add ArSL21L, CC BY 4.0)
#    and re-run: npx tsc --noEmit && npx vitest run && npm run build
```

## What "good" looks like after this
- `train.ts` held-out accuracy stays high **and** the calibration is now across two
  signer populations (the within-dataset caveat in SOURCES.md weakens).
- `calibrate.ts` FA stays ≤ the budget on the mixed split.
- No images committed; SOURCES.md credits both datasets with their licenses.

## Files
- `tools/extract-seeds/landmarks_from_images.py` — the offline MediaPipe extractor (built, ready).
- `tools/extract-seeds/extract.ts` / `calibrate.ts` / `train.ts` / `handshapes.ts` — reused unchanged.
