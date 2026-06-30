// HandSkeleton — draws the REAL average handshape for an alphabet letter as a
// legible HAND (filled palm + thick rounded finger "tubes"), not a bare dots-and-
// lines graph. The geometry is the mean of the normalised 21-point MediaPipe
// landmarks from real signers in the Zenodo ArSL dataset (CC-BY-4.0) — see
// tools/extract-seeds/handshapes.ts — so it stays honest while reading as a hand.
//
// Orientation: the seeds are rotation-canonicalised so the wrist→middle-knuckle
// axis points +x. We rotate the *display* by -90° (p → (y, -x)) so every letter
// is drawn upright (fingers up, wrist at the bottom), consistently.
import shapeData from "../recognizer/seeds/alphabet-shapes.json";

const SHAPES = (shapeData as { shapes: Record<string, number[][]> }).shapes;

// MediaPipe 21-point indices, grouped as fingers (each = 4 joints, base→tip).
const FINGERS: number[][] = [
  [1, 2, 3, 4], // thumb
  [5, 6, 7, 8], // index
  [9, 10, 11, 12], // middle
  [13, 14, 15, 16], // ring
  [17, 18, 19, 20], // pinky
];
// Palm outline: wrist → index/middle/ring/pinky knuckles → back to wrist.
const PALM = [0, 5, 9, 13, 17];

/** True when we have a real averaged handshape for this sign id. */
export function hasHandShape(signId: string): boolean {
  return signId in SHAPES;
}

export function HandSkeleton({
  signId,
  className = "h-full w-full",
  stroke = "currentColor",
}: {
  signId: string;
  className?: string;
  /** hand colour (defaults to currentColor so callers set it via text-*) */
  stroke?: string;
}) {
  const raw = SHAPES[signId];
  if (!raw) return null;

  // rotate -90° (fingers up) then fit into a padded 100×100 viewBox.
  const pts = raw.map(([x, y]) => [y, -x] as [number, number]);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const span = Math.max(maxX - minX, maxY - minY) || 1;
  const pad = 16;
  const scale = (100 - pad * 2) / span;
  const offX = pad + ((100 - pad * 2) - (maxX - minX) * scale) / 2;
  const offY = pad + ((100 - pad * 2) - (maxY - minY) * scale) / 2;
  const P = pts.map(([x, y]) => [offX + (x - minX) * scale, offY + (y - minY) * scale]);
  const path = (idx: number[]) => idx.map((i) => `${P[i][0].toFixed(1)},${P[i][1].toFixed(1)}`).join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={{ color: stroke }}
      role="img"
      aria-hidden="true"
      fill="none"
    >
      {/* Palm — filled so the hand reads as a solid shape, not floating lines. */}
      <polygon
        points={path(PALM)}
        fill="currentColor"
        fillOpacity={0.18}
        stroke="currentColor"
        strokeWidth={10}
        strokeLinejoin="round"
      />
      {/* Fingers — thick rounded tubes from each knuckle to the tip. The round caps
          give readable fingertips; overlap with the palm fuses them into a hand. */}
      {FINGERS.map((finger, i) => (
        <polyline
          key={i}
          points={path(finger)}
          stroke="currentColor"
          strokeWidth={9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {/* tip caps — a touch brighter so fingertips pop */}
      {FINGERS.map((finger, i) => {
        const tip = finger[finger.length - 1];
        return <circle key={`t${i}`} cx={P[tip][0]} cy={P[tip][1]} r={5} fill="currentColor" />;
      })}
    </svg>
  );
}
