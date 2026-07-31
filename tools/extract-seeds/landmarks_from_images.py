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

    # mediapipe >=0.10.21 dropped the legacy `solutions` API — fall back to the
    # Tasks API using the SAME vendored model the app ships (public/mediapipe/),
    # so extraction geometry matches the live camera exactly.
    if hasattr(mp, "solutions"):
        hands = mp.solutions.hands.Hands(
            static_image_mode=True,
            max_num_hands=1,
            min_detection_confidence=args.min_detection_confidence,
        )
        detect = lambda rgb: (
            [(p.x, p.y) for p in r.multi_hand_landmarks[0].landmark]
            if (r := hands.process(rgb)).multi_hand_landmarks else None
        )
        close = hands.close
    else:
        from mediapipe.tasks import python as mp_python
        from mediapipe.tasks.python import vision as mp_vision
        import numpy as np

        model = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                             "../../public/mediapipe/hand_landmarker.task")
        landmarker = mp_vision.HandLandmarker.create_from_options(
            mp_vision.HandLandmarkerOptions(
                base_options=mp_python.BaseOptions(model_asset_path=model),
                running_mode=mp_vision.RunningMode.IMAGE,
                num_hands=1,
                min_hand_detection_confidence=args.min_detection_confidence,
            )
        )
        detect = lambda rgb: (
            [(p.x, p.y) for p in r.hand_landmarks[0]]
            if (r := landmarker.detect(
                mp.Image(image_format=mp.ImageFormat.SRGB,
                         data=np.ascontiguousarray(rgb)))).hand_landmarks else None
        )
        close = landmarker.close

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
            lm = detect(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
            if lm is None:
                skipped_nohand += 1
                continue
            row = [sign]
            for x, y in lm:  # 21 normalised points
                row += [round(x, 6), round(y, 6)]
            w.writerow(row)
            counts[sign] = counts.get(sign, 0) + 1
            written += 1

    close()
    print(f"wrote {args.out}: {written} rows across {len(counts)} classes")
    print(f"per-class: {json.dumps(counts, ensure_ascii=False)}")
    print(f"skipped: {skipped_nohand} no-hand, {skipped_label} unmapped-label")
    thin = {k: v for k, v in counts.items() if v < 8}
    if thin:
        print(f"WARNING: classes under 8 samples (extract.ts requires >=8): {thin}")


if __name__ == "__main__":
    main()
