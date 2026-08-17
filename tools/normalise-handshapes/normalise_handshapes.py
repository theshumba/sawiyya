#!/usr/bin/env python3
"""
normalise_handshapes.py — turn the raw ArSL21L letter photos into a uniform set
of reference images: same framing, same hand size, no background.

The shipped photos are straight dataset crops, so every letter arrives with a
different kitchen, sofa, curtain, torso, crop and hand scale behind it. That is
what makes the dictionary look like a scrape rather than a product. Rather than
re-shoot 31 signs, this normalises what we have:

  1. MediaPipe HandLandmarker locates the hand, which gives a landmark bounding
     box — the only reliable way to frame every photo identically, and the same
     detector the in-app grader uses.
  2. The photo is cropped to that box plus padding, which alone removes most
     backgrounds (torsos, faces, furniture) before segmentation ever runs.
  3. rembg (u2net) cuts the hand out of the crop, and that silhouette is then
     bounded by the dilated convex hull of the landmarks. Segmentation alone
     keeps whatever is joined to the hand — a sleeve, a cuff, a watch — because
     it is all one connected subject; intersecting with the hull ends the
     silhouette at the wrist instead, whichever way the hand happens to point.
  4. The cutout is scaled so the hand occupies the same fraction of every frame
     and centred on a transparent square, so the card behind it shows through.
     Scale is measured from the bounded silhouette, so a photo that included a
     forearm no longer renders its hand smaller than everyone else's.

Orientation is NEVER changed: in Arabic Sign Language the direction a hand
points is part of the sign, so no rotation and no mirroring happen here.

Each output is re-checked with the landmarker: if the hand can no longer be
found, or the mask kept too little/too much of the frame, the letter is reported
as FAILED and its original photo is left in place. Correctness of the grading
pipeline is enforced separately and authoritatively by `npm run verify:grading`.

Usage:
  python3 -m venv .venv && source .venv/bin/activate
  pip install mediapipe rembg onnxruntime pillow numpy
  python3 tools/normalise-handshapes/normalise_handshapes.py \
      --src public/handshapes --out public/handshapes \
      --model public/mediapipe/hand_landmarker.task [--report report.json]
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session, remove

SIZE = 384  # output square, matching the existing assets
HAND_FILL = 0.72  # hand's long side as a fraction of the frame
CROP_PAD = 0.30  # padding around the landmark box, as a fraction of its long side
HULL_DILATE = 0.22  # hull growth, as a fraction of the hand's long side: landmarks sit
#                     on finger centres, so the hull must grow to cover flesh and nails
HULL_FADE = 0.07  # width of the fade at the hull edge, same units: it has to be wide enough
#                   to read as a soft wrist fade rather than a cut, but any wider bleeds
#                   transparency back over the fingers and the whole hand looks ghosted
MIN_COVERAGE = 0.06  # a mask thinner than this kept nothing useful
MAX_COVERAGE = 0.72  # a mask fatter than this kept the background too
SKIN_TOLERANCE = 26.0  # chroma distance from the hand's own colour that still counts as skin:
#                        wide enough for shadow and highlight on one hand, narrow enough to
#                        drop a cuff, a watch or a wall that segmentation kept because it
#                        touches the hand and is therefore the same connected subject
ALPHA_FLOOR, ALPHA_CEIL = 110, 190  # partial alpha below/above these becomes fully out/in:
#                                     u2net gives a wall or a blurred cuff a weak alpha,
#                                     which reads as grey haze once the card shows through

DEFAULT_MATTING = "u2net"
# Neither matting model wins everywhere and the difference is only visible to the eye, so
# the exceptions are recorded per letter rather than guessed at: isnet cuts a cuff or a
# blurred wrist away more cleanly, but on some photos it swallows the handshape itself
# (noon collapses into a featureless blob), which would teach the wrong sign.
MATTING_BY_STEM = {
    "alpha-dad": "isnet-general-use",
    "alpha-dal": "isnet-general-use",
    "alpha-ghain": "isnet-general-use",
    "alpha-waw": "isnet-general-use",
}


def build_landmarker(model: Path):
    base = mp.tasks.BaseOptions(model_asset_path=str(model))
    options = mp.tasks.vision.HandLandmarkerOptions(
        base_options=base,
        running_mode=mp.tasks.vision.RunningMode.IMAGE,
        num_hands=1,
        min_hand_detection_confidence=0.1,
    )
    return mp.tasks.vision.HandLandmarker.create_from_options(options)


def landmark_points(landmarker, rgb: np.ndarray) -> np.ndarray | None:
    """Return the hand's 21 landmarks in pixel coordinates, or None if not found."""
    result = landmarker.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb))
    if not result.hand_landmarks:
        return None
    h, w = rgb.shape[:2]
    return np.array([[lm.x * w, lm.y * h] for lm in result.hand_landmarks[0]], dtype=np.float32)


def landmark_box(points: np.ndarray) -> tuple[float, float, float, float]:
    return points[:, 0].min(), points[:, 1].min(), points[:, 0].max(), points[:, 1].max()


def hull_mask(points: np.ndarray, shape: tuple[int, int]) -> np.ndarray:
    """A soft mask covering the hand itself, so anything past the wrist is dropped."""
    x0, y0, x1, y1 = landmark_box(points)
    span = max(x1 - x0, y1 - y0)
    grow = max(2, round(HULL_DILATE * span))
    mask = np.zeros(shape, dtype=np.uint8)
    cv2.fillConvexPoly(mask, cv2.convexHull(points).astype(np.int32), 255)
    mask = cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (grow * 2 + 1,) * 2))
    return cv2.GaussianBlur(mask, (0, 0), max(1.0, HULL_FADE * span))


def skin_mask(rgb: np.ndarray, points: np.ndarray) -> np.ndarray:
    """A soft mask of pixels sharing the hand's own chroma, sampled at the landmarks.

    Chroma only: brightness varies hugely across one hand (knuckles in light, palm in
    shadow) while hue barely moves, and that also lets one reference photo be a pale
    hand and the next a dark one without any per-letter tuning.
    """
    ycrcb = cv2.cvtColor(rgb, cv2.COLOR_RGB2YCrCb).astype(np.float32)
    h, w = rgb.shape[:2]
    xs = np.clip(points[:, 0].astype(int), 0, w - 1)
    ys = np.clip(points[:, 1].astype(int), 0, h - 1)
    reference = np.median(ycrcb[ys, xs, 1:], axis=0)

    distance = np.linalg.norm(ycrcb[:, :, 1:] - reference, axis=2)
    mask = (distance <= SKIN_TOLERANCE).astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    return cv2.GaussianBlur(cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel), (0, 0), 1.5)


def harden(alpha: np.ndarray) -> np.ndarray:
    """Clip away semi-transparent haze while keeping a thin feathered edge."""
    stretched = (alpha.astype(np.float32) - ALPHA_FLOOR) * (255 / (ALPHA_CEIL - ALPHA_FLOOR))
    return np.clip(stretched, 0, 255).astype(np.uint8)


def largest_component(alpha: np.ndarray) -> np.ndarray:
    """Keep only the biggest blob, so a leftover sleeve or wall corner is dropped."""
    solid = (alpha > 24).astype(np.uint8)
    count, labels = cv2.connectedComponents(solid)
    if count <= 2:
        return alpha
    sizes = [(labels == i).sum() for i in range(1, count)]
    keep = 1 + int(np.argmax(sizes))
    return np.where(labels == keep, alpha, 0).astype(np.uint8)


def normalise(path: Path, landmarker, session) -> tuple[Image.Image | None, dict]:
    original = Image.open(path).convert("RGB")
    points = landmark_points(landmarker, np.asarray(original))
    if points is None:
        return None, {"status": "failed", "reason": "no hand found in the source photo"}

    x0, y0, x1, y1 = landmark_box(points)
    pad = CROP_PAD * max(x1 - x0, y1 - y0)
    left, top = max(0, round(x0 - pad)), max(0, round(y0 - pad))
    crop = original.crop((left, top, min(original.width, round(x1 + pad)), min(original.height, round(y1 + pad))))

    cut = remove(crop, session=session)
    local = (points - (left, top)).astype(np.float32)

    # Harden first, then gate: hardening the product instead would turn the hull's
    # deliberate fade at the wrist into a ragged, torn-looking edge.
    silhouette = harden(np.asarray(cut.split()[3])).astype(np.uint32)
    gate = hull_mask(local, (crop.height, crop.width)).astype(np.uint32)
    gate = gate * skin_mask(np.asarray(crop), local) // 255
    alpha = largest_component((silhouette * gate // 255).astype(np.uint8))
    coverage = float(alpha.mean() / 255)
    if not MIN_COVERAGE <= coverage <= MAX_COVERAGE:
        return None, {"status": "failed", "reason": f"mask coverage {coverage:.3f} out of range"}

    cut.putalpha(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.6)))
    cut = cut.crop(cut.getbbox())

    scale = (SIZE * HAND_FILL) / max(cut.size)
    cut = cut.resize((max(1, round(cut.width * scale)), max(1, round(cut.height * scale))), Image.LANCZOS)
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    canvas.paste(cut, ((SIZE - cut.width) // 2, (SIZE - cut.height) // 2), cut)

    # The asset is only worth shipping if the grader can still see a hand in it.
    # Check it against the card colours it will actually be composited over, since
    # a cutout is only ever seen through one of them.
    if not any(_detectable(landmarker, canvas, bg) for bg in ((246, 239, 227), (255, 255, 255))):
        return None, {"status": "failed", "reason": "the landmarker cannot find the hand after masking"}

    return canvas, {"status": "ok", "coverage": round(coverage, 3)}


def _detectable(landmarker, canvas: Image.Image, background: tuple[int, int, int]) -> bool:
    flat = Image.new("RGB", canvas.size, background)
    flat.paste(canvas, mask=canvas.split()[3])
    return landmark_points(landmarker, np.asarray(flat)) is not None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--src", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--report", type=Path)
    parser.add_argument(
        "--matting-model",
        help="force one matting model for every letter, ignoring the per-letter exceptions",
    )
    args = parser.parse_args()

    landmarker = build_landmarker(args.model)
    sessions: dict[str, object] = {}
    args.out.mkdir(parents=True, exist_ok=True)

    report: dict[str, dict] = {}
    for path in sorted(args.src.glob("*.webp")):
        matting = args.matting_model or MATTING_BY_STEM.get(path.stem, DEFAULT_MATTING)
        session = sessions.setdefault(matting, new_session(matting))
        image, detail = normalise(path, landmarker, session)
        detail["matting"] = matting
        if image is not None:
            image.save(args.out / path.name, "WEBP", quality=90, method=6)
            detail["kb"] = round((args.out / path.name).stat().st_size / 1024, 1)
        report[path.name] = detail
        print(f"{path.name:20} {detail['status']:6} {detail.get('reason', '')}")

    failed = [name for name, d in report.items() if d["status"] != "ok"]
    print(f"\n{len(report) - len(failed)}/{len(report)} normalised; failed: {failed or 'none'}")
    if args.report:
        args.report.write_text(json.dumps(report, indent=2) + "\n")


if __name__ == "__main__":
    main()
