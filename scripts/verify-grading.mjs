// Does the camera actually grade? The end-to-end check, in a real browser.
//
// WHY THIS EXISTS (2026-08-01): the camera graded every letter at exactly 0%,
// for every user, from the day the mirror trigger was written. Nothing caught it
// because both automated gates had written the camera off in a comment —
// normalize.test.ts called the trigger "OWNER-GATED" on a manual phone check,
// and scripts/smoke.mjs said "camera paths are exercised separately on-device".
// Neither check ever ran. The app's one differentiating feature was the only
// part with no test.
//
// The idea that makes this testable: the app ships 28 reference photos of a real
// signer, and tells the learner to copy them. So a hand that IS the reference
// must score against its own letter. No judgement call, no eyeballing a meter.
//
// This runs the WHOLE real path — actual MediaPipe wasm, actual image decode,
// actual handedness labels — over those 28 photos. src/recognizer/normalize.test.ts
// runs the same assertion in CI against frozen landmarks; this is what keeps that
// fixture honest. RUN THIS whenever MediaPipe, the model, the seeds or the
// normaliser change, and pass --write-fixture to refresh the frozen copy.
//
// Usage:  node scripts/verify-grading.mjs [--write-fixture]
import { chromium } from "playwright-core";
import { createServer } from "http";
import { readFile, writeFile } from "fs/promises";
import { readdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join, extname } from "path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const WRITE_FIXTURE = process.argv.includes("--write-fixture");
const FIXTURE = join(ROOT, "src/recognizer/fixtures/reference-landmarks.json");
/** A reference photo scoring below this against its own letter means the grader
 *  is broken. Real spread across the 28 is 59–100%; the floor is deliberately
 *  well under the worst of them so normal model drift doesn't cry wolf. */
const MIN_CONFIDENCE = 0.4;

const TYPES = { ".html": "text/html", ".mjs": "text/javascript", ".js": "text/javascript", ".json": "application/json", ".wasm": "application/wasm", ".webp": "image/webp", ".task": "application/octet-stream" };

const server = createServer(async (req, res) => {
  const path = join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  if (!path.startsWith(ROOT) || !existsSync(path)) { res.writeHead(404).end("no"); return; }
  try {
    res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream" });
    res.end(await readFile(path));
  } catch { res.writeHead(500).end("err"); }
});
await new Promise((r) => server.listen(0, r));
const PORT = server.address().port;

const PAGE = `<!doctype html><meta charset="utf-8"><title>run</title><pre id="out"></pre><script type="module">
import { FilesetResolver, HandLandmarker } from "/node_modules/@mediapipe/tasks-vision/vision_bundle.mjs";
const MIDDLE_MCP = 9;
// mirrored from src/recognizer/normalize.ts — this file must exercise the SHIPPED
// maths, so if you change one, change both (the vitest run compares their output).
function normalizeLandmarks(lms, mirror) {
  const wrist = lms[0];
  const rel = lms.map((p) => { const x = p.x - wrist.x, y = p.y - wrist.y; return [mirror ? -x : x, y]; });
  const ref = rel[MIDDLE_MCP];
  const th = Math.atan2(ref[1], ref[0]), cos = Math.cos(-th), sin = Math.sin(-th);
  let scale = 0;
  const rot = rel.map(([x, y]) => { const rx = x * cos - y * sin, ry = x * sin + y * cos; const d = Math.hypot(rx, ry); if (d > scale) scale = d; return [rx, ry]; });
  if (scale === 0) scale = 1;
  const out = []; for (const [x, y] of rot) out.push(x / scale, y / scale); return out;
}
const euclidean = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; } return Math.sqrt(s); };
const seeds = await (await fetch("/src/recognizer/seeds/alphabet.json")).json();
const model = await (await fetch("/src/recognizer/seeds/alphabet-model.json")).json();
const { classes, D, H, W1, b1, W2, b2, tau } = model;
const TAU = typeof tau === "number" ? tau : 0.5, OOD = 0.65;
const softmax = (x) => {
  const a = new Array(H);
  for (let j = 0; j < H; j++) { let s = b1[j]; for (let i = 0; i < D; i++) s += x[i] * W1[i][j]; a[j] = s > 0 ? s : 0; }
  const o = new Array(classes.length);
  for (let k = 0; k < classes.length; k++) { let s = b2[k]; for (let j = 0; j < H; j++) s += a[j] * W2[j][k]; o[k] = s; }
  const m = Math.max(...o), e = o.map((z) => Math.exp(z - m)), Z = e.reduce((p, q) => p + q, 0) || 1;
  return e.map((z) => z / Z);
};
const nearest = (v, id) => { let b = Infinity; for (const s of (seeds[id] || [])) { const d = euclidean(v, s); if (d < b) b = d; } return b; };
const fileset = await FilesetResolver.forVisionTasks("/public/mediapipe/wasm");
const lmk = await HandLandmarker.createFromOptions(fileset, {
  baseOptions: { modelAssetPath: "/public/mediapipe/hand_landmarker.task", delegate: "CPU" },
  runningMode: "IMAGE", numHands: 1,
});
const round = (n) => Math.round(n * 1e5) / 1e5;
const results = [];
for (const id of classes) {
  const img = new Image(); img.src = "/public/handshapes/" + id + ".webp";
  try { await img.decode(); } catch { results.push({ id, error: "photo missing" }); continue; }
  const r = lmk.detect(img);
  if (!r.landmarks?.length) { results.push({ id, error: "no hand found in the reference photo" }); continue; }
  const lms = r.landmarks[0];
  const hand = r.handedness?.[0]?.[0]?.categoryName ?? r.handednesses?.[0]?.[0]?.categoryName ?? "Right";
  // THE POLICY UNDER TEST — keep identical to normalize.ts mirrorForDetectedHand.
  const vec = normalizeLandmarks(lms, hand === "Right");
  const p = softmax(vec), ti = classes.indexOf(id);
  let am = 0; for (let k = 1; k < p.length; k++) if (p[k] > p[am]) am = k;
  const seedD = nearest(vec, id), inDist = seedD <= OOD;
  results.push({ id, hand, confidence: inDist ? p[ti] : 0, matched: classes[am] === id && p[ti] >= TAU && inDist, seedD,
    lms: lms.map((q) => [round(q.x), round(q.y), round(q.z)]) });
}
window.__RESULTS = JSON.stringify(results);
document.title = "DONE";
</script>`;

const cacheDir = join(homedir(), "Library/Caches/ms-playwright");
const shellDir = readdirSync(cacheDir).filter((d) => d.startsWith("chromium_headless_shell-")).sort().at(-1);
const browser = await chromium.launch({ executablePath: join(cacheDir, shellDir, "chrome-headless-shell-mac-arm64/chrome-headless-shell") });
const page = await browser.newPage();
await page.route("**/__run.html", (r) => r.fulfill({ contentType: "text/html", body: PAGE }));
const fatal = [];
page.on("pageerror", (e) => fatal.push(String(e).split("\n")[0]));
await page.goto(`http://localhost:${PORT}/__run.html`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => document.title === "DONE", null, { timeout: 180000 }).catch(() => fatal.push("the grading run never finished"));

const results = JSON.parse((await page.evaluate(() => window.__RESULTS)) ?? "[]");
await browser.close();
server.close();

if (fatal.length) { for (const f of fatal) console.error("FATAL:", f); process.exit(1); }
if (!results.length) { console.error("FATAL: no letters were graded at all"); process.exit(1); }

const bad = results.filter((r) => r.error || !r.matched || r.confidence < MIN_CONFIDENCE);
console.log(`Grading the app's own ${results.length} reference photos through the live pipeline:\n`);
for (const r of results) {
  const ok = !r.error && r.matched && r.confidence >= MIN_CONFIDENCE;
  console.log(
    `  ${ok ? "ok  " : "FAIL"}  ${r.id.replace("alpha-", "").padEnd(7)}`,
    r.error ? r.error : `${(r.confidence * 100).toFixed(0).padStart(3)}%  seedD ${r.seedD.toFixed(3)}  (MediaPipe said ${r.hand})`,
  );
}

if (WRITE_FIXTURE && !bad.length) {
  const fx = {};
  for (const r of results) fx[r.id] = { hand: r.hand, lms: r.lms };
  await writeFile(FIXTURE, JSON.stringify(fx));
  console.log(`\nfixture refreshed: ${FIXTURE}`);
}

if (bad.length) {
  console.error(`\n${bad.length} of ${results.length} reference photos do not grade as their own letter.`);
  console.error("The camera cannot grade a hand that IS the reference, so it cannot grade a learner's.");
  console.error("Check the mirror trigger in src/recognizer/normalize.ts first — that is what broke it in 2026-08.");
  process.exit(1);
}
console.log(`\nall ${results.length} reference photos grade as their own letter`);
