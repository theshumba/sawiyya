// handshapes.ts — derive a per-letter reference HANDSHAPE from the real seed
// landmark vectors (seeds/alphabet.json, Zenodo ArSL, CC-BY-4.0). For each of the
// 28 letters we average the normalised 42-dim vectors across all real-signer
// samples → one mean 21-point hand. This is genuine geometry (not an artist's
// guess, not an emoji): the average shape real signers made for that letter.
// Emits seeds/alphabet-shapes.json consumed by <HandSkeleton/> to draw the hand.
//
//   run:  npx tsx tools/extract-seeds/handshapes.ts
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const SEEDS = resolve(__dir, "../../src/recognizer/seeds/alphabet.json");
const OUT = resolve(__dir, "../../src/recognizer/seeds/alphabet-shapes.json");

const raw = JSON.parse(readFileSync(SEEDS, "utf8")) as Record<string, number[][]>;
const shapes: Record<string, [number, number][]> = {};

for (const [id, vecs] of Object.entries(raw)) {
  const D = vecs[0].length; // 42
  const mean = new Array(D).fill(0);
  for (const v of vecs) for (let i = 0; i < D; i++) mean[i] += v[i];
  for (let i = 0; i < D; i++) mean[i] /= vecs.length;
  // flat [x0,y0,...,x20,y20] → 21 points, rounded to 3dp for compact storage
  const pts: [number, number][] = [];
  for (let i = 0; i < D; i += 2)
    pts.push([Math.round(mean[i] * 1000) / 1000, Math.round(mean[i + 1] * 1000) / 1000]);
  shapes[id] = pts;
}

writeFileSync(
  OUT,
  JSON.stringify({
    note: "Mean normalised 21-point hand per letter, averaged over real-signer seed vectors.",
    source: "alphabet.json (Zenodo ArSL, CC-BY-4.0)",
    shapes,
  }),
);
console.log(`wrote ${OUT} — ${Object.keys(shapes).length} letter handshapes`);
