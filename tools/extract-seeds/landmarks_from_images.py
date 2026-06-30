#!/usr/bin/env python3
"""
landmarks_from_images.py — run MediaPipe Hands OFFLINE over an image dataset and
emit a CSV in the SAME schema as tools/extract-seeds/dataset/ArSL_dataset.csv
( header: Sign;x0;y0;...;x20;y20 ), so the existing TS pipeline
(extract.ts -> calibrate.ts -> train.ts) can be reused UNCHANGED to add more
real signers to Sawiyya's alphabet model.

Why Python (not Node): @mediapipe/tasks-vision is the WASM/web build and needs a
DOM/canvas to decode images; the Python `mediapipe` package runs HandLandmarker
headless on a numpy RGB array — the path of least resistance. See docs/PHASE-B-DATA.md.

WE SHIP ONLY DERIVED LANDMARKS, NEVER THE IMAGES. Keep the raw image folders in
.gitignore. Respect each dataset's license (see docs/PHASE-B-DATA.md):
  - ArSL21L  : CC BY 4.0      -> OK commercially, attribution required
  - AASL     : license DISPUTED (Kaggle shows CC BY-NC-SA; NC would BLOCK us) ->
               confirm with the owner BEFORE using. Do not assume CC BY-SA.

Usage:
  python3 -m venv .venv && source .venv/bin/activate
  pip install --upgrade pip && pip install mediapipe opencv-python numpy
  python3 tools/extract-seeds/landmarks_from_images.py \
      --images tools/extract-seeds/dataset/arsl21l \
      --out    tools/extract-seeds/dataset/arsl21l_landmarks.csv \
      --label-map tools/extract-seeds/arsl21l_labels.json \
      --max-per-class 120

`--images` must be a folder of per-class subfolders (subfolder name = raw class
label). `--label-map` is a JSON object mapping raw label -> Sawiyya class id
(e.g. {"Alef": "alpha-alif", ...}); labels mapping to null are skipped. The 28
target ids are listed in extract.ts LABEL_MAP. After running, merge/extend the CSV
into the extract.ts input and re-run extract/calibrate/train.
"""
import argparse
import csv
import json
import os
import sys

try:
    import cv2
    import numpy as np
    import mediapipe as mp
except ImportError as e:  # pragma: no cover - environment guard
    sys.exit(
        f"Missing dependency: {e}. Install with:\n"
        "  python3 -m venv .venv && source .venv/bin/activate\n"
        "  pip install --upgrade pip && pip install mediapipe opencv-python numpy"
    )


def iter_images(root):
    exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    for label in sorted(os.listdir(root)):
        d = os.path.join(root, label)
        if not os.path.isdir(d):
            continue
        files = [f for f in sorted(os.listdir(d)) if os.path.splitext(f)[1].lower() in exts]
        for f in files:
            yield label, os.path.join(d, f)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--images", required=True, help="root folder of per-class image subfolders")
    ap.add_argument("--out", required=True, help="output CSV path")
    ap.add_argument("--label-map", required=True, help="JSON: raw label -> alpha-* id (null to skip)")
    ap.add_argument("--max-per-class", type=int, default=120)
    ap.add_argument("--min-detection-confidence", type=float, default=0.5)
    args = ap.parse_args()

    with open(args.label_map) as fh:
        label_map = json.load(fh)

    hands = mp.solutions.hands.Hands(
        static_image_mode=True,
        max_num_hands=1,
        min_detection_confidence=args.min_detection_confidence,
    )

    header = ["Sign"] + [f"{ax}{i}" for i in range(21) for ax in ("x", "y")]
    counts, written, skipped_nohand, skipped_label = {}, 0, 0, 0

    with open(args.out, "w", newline="") as out:
        w = csv.writer(out, delimiter=";")
        w.writerow(header)
        for raw_label, path in iter_images(args.images):
            sign = label_map.get(raw_label, "__UNMAPPED__")
            if sign is None:
                continue  # explicitly dropped (control sign / unmapped variant)
            if sign == "__UNMAPPED__":
                skipped_label += 1
                continue
            if counts.get(sign, 0) >= args.max_per_class:
                continue
            img = cv2.imread(path)
            if img is None:
                continue
            res = hands.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
            if not res.multi_hand_landmarks:
                skipped_nohand += 1
                continue
            lm = res.multi_hand_landmarks[0].landmark  # 21 normalised points
            row = [sign]
            for p in lm:
                row += [round(p.x, 6), round(p.y, 6)]
            w.writerow(row)
            counts[sign] = counts.get(sign, 0) + 1
            written += 1

    hands.close()
    print(f"wrote {args.out}: {written} rows across {len(counts)} classes")
    print(f"per-class: {json.dumps(counts, ensure_ascii=False)}")
    print(f"skipped: {skipped_nohand} no-hand, {skipped_label} unmapped-label")
    thin = {k: v for k, v in counts.items() if v < 8}
    if thin:
        print(f"WARNING: classes under 8 samples (extract.ts requires >=8): {thin}")


if __name__ == "__main__":
    main()
