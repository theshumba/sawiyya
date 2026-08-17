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

From the repository root, regenerate the assets with:

```bash
.venv-signs/bin/python tools/normalise-handshapes/normalise_handshapes.py \
  --src public/handshapes \
  --out public/handshapes \
  --model public/mediapipe/hand_landmarker.task \
  --report normfinal-report.json
```

The normalisation report intentionally leaves `alpha-laa.webp` and
`alpha-meem.webp` as their original source photos: the first has no detectable
hand in the source, and the second could not be reliably detected after
masking.
