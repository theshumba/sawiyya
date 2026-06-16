// MediaPipe HandLandmarker hook — lifted from the proven spike (spike.html).
// 21 landmarks per frame, fully on-device; the landmarker is a module
// singleton so screens share one model download (then SW-cached offline).
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DrawingUtils,
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";
import type { LM } from "./normalize";

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

let landmarkerPromise: Promise<HandLandmarker> | null = null;

// The landmarker is a module singleton, so only ONE detect loop may feed it at a
// time — VIDEO mode requires strictly increasing timestamps, and two concurrent
// loops (e.g. a screen transition briefly mounting two CameraTrainers) would send
// colliding timestamps and permanently corrupt the graph. Each loop claims this
// counter; older loops self-terminate once a newer one takes over.
let activeLoop = 0;

function getLandmarker(): Promise<HandLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
      return HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        numHands: 1,
      });
    })().catch((e) => {
      landmarkerPromise = null; // allow retry after a failed load
      throw e;
    });
  }
  return landmarkerPromise;
}

export type TrackerStatus = "idle" | "loading" | "running" | "error";

export interface FrameInfo {
  landmarks: LM[];
  /** MediaPipe's detected handedness label for the visible hand. */
  detectedHand: "Left" | "Right";
  timeMs: number;
}

export function useHandTracker(onFrame: (frame: FrameInfo | null) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  const [status, setStatus] = useState<TrackerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [handVisible, setHandVisible] = useState(false);

  const running = useRef(false);
  const raf = useRef(0);
  const stream = useRef<MediaStream | null>(null);
  // Generation token: each start() claims one; stop() (or a newer start) bumps it,
  // cancelling any in-flight start that is still awaiting the camera/model. This is
  // what prevents two rAF loops from feeding the singleton landmarker non-monotonic
  // timestamps ("Packet timestamp mismatch"), which permanently corrupts the graph.
  const startGen = useRef(0);

  const stop = useCallback(() => {
    running.current = false;
    startGen.current += 1; // invalidate any start() mid-await
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setStatus("idle");
    setHandVisible(false);
  }, []);

  const start = useCallback(async () => {
    if (running.current) return;
    running.current = true; // claim synchronously — closes the async-gap race
    const gen = (startGen.current += 1);
    const cancelled = () => gen !== startGen.current;
    setStatus("loading");
    setError(null);
    try {
      const landmarker = await getLandmarker();
      if (cancelled()) return;
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 960 } },
        audio: false,
      });
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (cancelled() || !video || !canvas) {
        media.getTracks().forEach((t) => t.stop());
        if (!cancelled()) running.current = false;
        return;
      }
      stream.current = media;
      video.srcObject = media;
      await video.play();
      if (cancelled()) {
        media.getTracks().forEach((t) => t.stop());
        stream.current = null;
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d")!;
      const draw = new DrawingUtils(ctx);

      setStatus("running");
      const myLoop = ++activeLoop; // claim sole ownership of the singleton landmarker

      let lastVideoTime = -1;
      let frames = 0;
      let fpsT = 0;

      // setHandVisible fires per frame; only push when it actually flips (Q1).
      let handVisibleNow = false;
      const setHandVisibleIfChanged = (v: boolean) => {
        if (v !== handVisibleNow) {
          handVisibleNow = v;
          setHandVisible(v);
        }
      };

      const loop = (t: number) => {
        if (!running.current || myLoop !== activeLoop) return; // superseded by a newer loop
        // Some mobile Safari builds report videoWidth 0 until metadata fires, leaving
        // the overlay canvas 0×0 all session; lazily size it once dimensions exist (M4).
        if ((canvas.width === 0 || canvas.height === 0) && video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          const res: HandLandmarkerResult = landmarker.detectForVideo(video, t);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (res.landmarks && res.landmarks.length > 0) {
            setHandVisibleIfChanged(true);
            const lm = res.landmarks[0];
            draw.drawConnectors(lm, HandLandmarker.HAND_CONNECTIONS, {
              color: "#E6B24C",
              lineWidth: 4,
            });
            draw.drawLandmarks(lm, {
              color: "#FBF7EF",
              fillColor: "#E8654C",
              radius: 5,
              lineWidth: 1,
            });
            const detectedHand =
              (res.handednesses?.[0]?.[0]?.categoryName as "Left" | "Right") ?? "Right";
            onFrameRef.current({ landmarks: lm as LM[], detectedHand, timeMs: t });
          } else {
            setHandVisibleIfChanged(false);
            onFrameRef.current(null);
          }
        }
        frames += 1;
        if (t - fpsT > 500) {
          setFps(Math.round((frames * 1000) / (t - fpsT)));
          frames = 0;
          fpsT = t;
        }
        raf.current = requestAnimationFrame(loop);
      };
      raf.current = requestAnimationFrame(loop);
    } catch (e) {
      if (!cancelled()) {
        running.current = false; // allow retry after a failed start
        setStatus("error");
        setError(e instanceof Error ? e.message : String(e));
      }
    }
  }, []);

  useEffect(() => stop, [stop]);

  return { videoRef, canvasRef, status, error, fps, handVisible, start, stop };
}
