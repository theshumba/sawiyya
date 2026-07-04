# Vendored MediaPipe runtime + model (H10)

Self-hosted so the recognizer is **offline from install** with **zero runtime CDN
dependency** (was: jsdelivr for the wasm + Google storage for the model). Loaded
by `src/recognizer/useHandTracker.ts` from `mediapipe/` under the app base.

## `wasm/` — MediaPipe Tasks-Vision runtime
- Source: `node_modules/@mediapipe/tasks-vision/wasm/*`
- Version: **0.10.14** (pinned exactly in `package.json`)
- Files: `vision_wasm_internal.{js,wasm}` (SIMD) + `vision_wasm_nosimd_internal.{js,wasm}` (fallback)
- `FilesetResolver.forVisionTasks()` picks SIMD vs no-SIMD at runtime.
- Precache: the SIMD wasm is precached; the 9.3MB **no-SIMD** wasm is excluded
  from precache (see `vite.config.ts` `globIgnores`) — it's still served locally,
  just fetched on demand for the rare legacy device.

## `hand_landmarker.task` — hand landmark model (float16)
- Source: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`
- Size: 7,819,105 bytes
- md5 (base64): `FTGEMOo4UWcP6ZFBFqnPrQ==` (verified on vendor)

## Refresh procedure
```
cp node_modules/@mediapipe/tasks-vision/wasm/* public/mediapipe/wasm/   # after bumping the pin
curl -sL -o public/mediapipe/hand_landmarker.task \
  https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task
```
Keep the wasm version and the tasks-vision pin in lock-step.
