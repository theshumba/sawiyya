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
// Draw fingers back→front (pinky last-behind, index/thumb in front) so the front
// fingers' dark edges visually separate the ones behind them.
const DRAW_ORDER = [4, 3, 2, 0, 1]; // pinky, ring, middle, thumb, index
// Fixed translucent-dark edge — reads as a separating outline on a light card and
// as a soft shadow under the white hand on the teal camera chip.
const EDGE = "rgba(7, 33, 31, 0.30)";

/** True when we have a real averaged handshape for this sign id. */
export function hasHandShape(signId: string): boolean {
  return signId in SHAPES;
}

export function HandSkeleton({
  signId,
  className = "h-full w-full",
  stroke = "currentColor",
  coachFinger = null,
}: {
  signId: string;
  className?: string;
  /** hand colour (defaults to currentColor so callers set it via text-*) */
  stroke?: string;
  /** Sign Coach: finger group index (0 thumb … 4 pinky) to highlight in gold,
   *  drawn on top so the learner sees exactly which finger to fix. */
  coachFinger?: number | null;
}) {
  const raw = SHAPES[signId];
  if (!raw) return null;

  // Coached finger renders last (on top) in both passes so its gold core and
  // edge aren't buried under neighbouring fingers.
  const drawOrder =
    coachFinger === null
      ? DRAW_ORDER
      : [...DRAW_ORDER.filter((fi) => fi !== coachFinger), coachFinger];

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
      {/* Each part is drawn EDGE-then-CORE: a darker, wider outline under the
          coloured fill. Where fingers overlap, the edge shows as a separating line,
          so a folded hand reads clearly instead of fusing into one blob. The edge
          colour is a fixed translucent dark so it works on light cards AND the teal
          camera chip (where the hand is white). */}
      {/* palm edge + fill */}
      <polygon points={path(PALM)} fill="none" stroke={EDGE} strokeWidth={14} strokeLinejoin="round" />
      <polygon
        points={path(PALM)}
        fill="currentColor"
        fillOpacity={0.16}
        stroke="currentColor"
        strokeWidth={9}
        strokeLinejoin="round"
      />
      {/* fingers — back (pinky) to front (thumb/index) so the front edges separate
          the fingers behind them. Edge pass first, then the coloured core. */}
      {drawOrder.map((fi) => (
        <polyline
          key={`e${fi}`}
          points={path(FINGERS[fi])}
          fill="none"
          stroke={EDGE}
          strokeWidth={14}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {drawOrder.map((fi) => (
        <polyline
          key={`c${fi}`}
          points={path(FINGERS[fi])}
          fill="none"
          stroke={fi === coachFinger ? "#E6B24C" : "currentColor"}
          strokeWidth={8.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
