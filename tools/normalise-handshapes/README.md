# Handshape normalisation

This pipeline turns the ArSL21L reference photos into landmark-framed,
background-removed WebP cutouts on transparent 384×384 canvases. It keeps each
sign's original orientation because direction is part of the sign, and
re-checks every generated cutout with the MediaPipe hand landmarker.

Create the project environment and install the pipeline dependencies:

```bash
python3 -m venv .venv-signs
.venv-signs/bin/pip install mediapipe rembg onnxruntime pillow numpy opencv-python
```

The pipeline consumes the **original ArSL21L dataset crops**, not the already
normalised files currently in `public/handshapes`. The repository's
pre-normalisation commit is `2c836fbb5cc6ae698c874ac9ab6df67d706352a1`.
Extract its original WebP crops into a scratch directory, then run the
pipeline from the repository root:

```bash
ORIGINAL_COMMIT=2c836fbb5cc6ae698c874ac9ab6df67d706352a1
ORIGINAL_DIR=/tmp/sawiyya-original-handshapes
mkdir -p "$ORIGINAL_DIR"
git ls-tree -r --name-only "$ORIGINAL_COMMIT" public/handshapes/ |
  grep '\.webp$' |
  while read -r path; do
    git show "$ORIGINAL_COMMIT:$path" > "$ORIGINAL_DIR/${path##*/}"
  done

.venv-signs/bin/python tools/normalise-handshapes/normalise_handshapes.py \
  --src "$ORIGINAL_DIR" \
  --out public/handshapes \
  --model public/mediapipe/hand_landmarker.task \
  --report /tmp/normalise-handshapes-report.json
```

The normalisation report intentionally leaves `alpha-laa.webp`,
`alpha-meem.webp`, and `alpha-ra.webp` as their original source photos. The
first has no detectable hand in the source, the second could not be reliably
detected after masking, and the third's cutout was not recognised by the
in-app grading guard.
