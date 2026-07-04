// Make Stitch brand illustrations true transparent cutouts.
// The raw exports bake their background in (white / black / transparency-checkerboard),
// which looks broken on coloured cards. We flood-fill the border-connected background
// to transparency using a browser canvas (no native image deps needed).
import { chromium } from "playwright-core";
import { homedir } from "os";
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, copyFileSync } from "fs";
import { join, basename } from "path";

const cacheDir = join(homedir(), "Library/Caches/ms-playwright");
const shell = readdirSync(cacheDir).filter((d) => d.startsWith("chromium_headless_shell-")).sort().at(-1);
const executablePath = join(cacheDir, shell, "chrome-headless-shell-mac-arm64/chrome-headless-shell");

const BRAND = "public/brand";
// Pristine raw exports live OUTSIDE public/ so they never ship or get precached (H9).
const RAW = "design/brand-raw";
mkdirSync(RAW, { recursive: true });

// files passed on argv, else all used assets listed in /tmp/used.txt
const files = process.argv.slice(2);
if (!files.length) { console.error("pass file paths"); process.exit(1); }

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage();

for (const rel of files) {
  const f = rel.startsWith("public/") ? rel : join(BRAND, basename(rel));
  if (!existsSync(f)) { console.log("MISSING", f); continue; }
  // back up original once
  const bak = join(RAW, basename(f));
  if (!existsSync(bak)) copyFileSync(f, bak);
  const src = existsSync(bak) ? bak : f; // always clean from the pristine original
  const b64 = readFileSync(src).toString("base64");

  const GLOBAL = process.env.GLOBAL === "1";
  const out = await page.evaluate(async ({ dataUrl, global }) => {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const w = img.naturalWidth, h = img.naturalHeight;
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    const id = ctx.getImageData(0, 0, w, h);
    const d = id.data;
    const idx = (x, y) => (y * w + x) * 4;

    // sample border colours as background seeds
    const seeds = [];
    const push = (x, y) => { const i = idx(x, y); seeds.push([d[i], d[i + 1], d[i + 2]]); };
    for (let x = 0; x < w; x += Math.max(1, (w / 40) | 0)) { push(x, 0); push(x, h - 1); }
    for (let y = 0; y < h; y += Math.max(1, (h / 40) | 0)) { push(0, y); push(w - 1, y); }
    // dedupe-ish into clusters (tolerance 24)
    const clusters = [];
    for (const s of seeds) {
      let hit = clusters.find((c2) => Math.abs(c2[0] - s[0]) + Math.abs(c2[1] - s[1]) + Math.abs(c2[2] - s[2]) < 24);
      if (!hit) clusters.push(s.slice());
    }
    const T = 60; // Euclidean tolerance for "is background"
    const isBg = (i) => clusters.some((c2) => {
      const dr = d[i] - c2[0], dg = d[i + 1] - c2[1], db = d[i + 2] - c2[2];
      return dr * dr + dg * dg + db * db <= T * T;
    });

    // BFS flood from border through bg-classified pixels
    const visited = new Uint8Array(w * h);
    const stack = [];
    const seed = (x, y) => { const p = y * w + x; if (!visited[p] && isBg(idx(x, y))) { visited[p] = 1; stack.push(p); } };
    for (let x = 0; x < w; x++) { seed(x, 0); seed(x, h - 1); }
    for (let y = 0; y < h; y++) { seed(0, y); seed(w - 1, y); }
    let removed = 0;
    while (stack.length) {
      const p = stack.pop();
      const x = p % w, y = (p / w) | 0;
      d[p * 4 + 3] = 0; removed++;
      const nb = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
      for (const [nx, ny] of nb) {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const np = ny * w + nx;
        if (!visited[np] && isBg(idx(nx, ny))) { visited[np] = 1; stack.push(np); }
      }
    }
    // GLOBAL mode: also remove bg-coloured pixels not connected to the border
    // (interior checkerboard pockets). Safe ONLY for assets with no legit light areas.
    if (global) {
      for (let i = 0; i < w * h; i++) {
        if (d[i * 4 + 3] !== 0 && isBg(i * 4)) { d[i * 4 + 3] = 0; removed++; }
      }
    }
    // soften 1px halo: any kept pixel adjacent to transparent and near a bg colour → partial alpha
    ctx.putImageData(id, 0, 0);
    return { w, h, removedPct: Math.round((removed / (w * h)) * 100), clusters: clusters.length, url: c.toDataURL("image/png") };
  }, { dataUrl: `data:image/png;base64,${b64}`, global: GLOBAL });

  const buf = Buffer.from(out.url.split(",")[1], "base64");
  writeFileSync(f, buf);
  console.log(`cleaned ${basename(f)}  ${out.w}x${out.h}  bg-removed ${out.removedPct}%  (${out.clusters} bg clusters)`);
}

await browser.close();
console.log("done");
