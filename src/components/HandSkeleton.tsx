// HandSkeleton — draws the REAL average handshape for an alphabet letter.
// The geometry is the mean of the normalised 21-point MediaPipe landmarks taken
// from real signers in the Zenodo ArSL dataset (CC-BY-4.0) — see
// tools/extract-seeds/handshapes.ts. This is the honest "show me the hand" visual:
// not an emoji, not the bare letter, but the actual shape real people made.
//
// Orientation: the seeds are rotation-canonicalised so the wrist→middle-knuckle
// axis points +x. We rotate the *display* by -90° (p → (y, -x)) so every letter
// is drawn upright (fingers up, wrist at the bottom), consistently.
import shapeData from "../recognizer/seeds/alphabet-shapes.json";

const SHAPES = (shapeData as { shapes: Record<string, number[][]> }).shapes;

/** MediaPipe 21-point hand bones. */
const BONES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], // thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // index
  [5, 9], [9, 10], [10, 11], [11, 12], // middle
  [9, 13], [13, 14], [14, 15], [15, 16], // ring
  [13, 17], [17, 18], [18, 19], [19, 20], // pinky
  [0, 17], // palm base
];
const TIPS = new Set([4, 8, 12, 16, 20]);

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
  /** bone/joint colour (defaults to currentColor so callers set it via text-*) */
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
  const pad = 14;
  const scale = (100 - pad * 2) / span;
  // centre the (possibly non-square) hand within the box
  const offX = pad + ((100 - pad * 2) - (maxX - minX) * scale) / 2;
  const offY = pad + ((100 - pad * 2) - (maxY - minY) * scale) / 2;
  const P = pts.map(([x, y]) => [offX + (x - minX) * scale, offY + (y - minY) * scale]);

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={{ color: stroke }}
      role="img"
      aria-hidden="true"
      fill="none"
    >
      {BONES.map(([a, b], i) => (
        <line
          key={i}
          x1={P[a][0]} y1={P[a][1]} x2={P[b][0]} y2={P[b][1]}
          stroke="currentColor" strokeWidth={4.5} strokeLinecap="round" opacity={0.85}
        />
      ))}
      {P.map(([x, y], i) => (
        <circle
          key={i}
          cx={x} cy={y}
          r={i === 0 ? 4.6 : TIPS.has(i) ? 3.8 : 2.8}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}
