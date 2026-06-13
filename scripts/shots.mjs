// Capture current-UI screenshots for design review (Stitch v2 flow).
// Two isolated passes: (1) clean nav/modal screens, no camera; (2) the live
// camera + celebration flow (MediaPipe). Splitting them keeps headless MediaPipe
// errors from destabilising the rest of the capture.
import { chromium } from "playwright-core";
import { homedir } from "os";
import { readdirSync, mkdirSync } from "fs";
import { join } from "path";

const cacheDir = join(homedir(), "Library/Caches/ms-playwright");
const shell = readdirSync(cacheDir).filter((d) => d.startsWith("chromium_headless_shell-")).sort().at(-1);
const executablePath = join(cacheDir, shell, "chrome-headless-shell-mac-arm64/chrome-headless-shell");

const OUT = "/tmp/sawiyya-shots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath,
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
});

async function newPage() {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    permissions: ["camera"],
    reducedMotion: "reduce",
  });
  return ctx.newPage();
}

const mk = (page) => {
  const settle = async (ms = 450) => {
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.evaluate(() => Promise.all([...document.querySelectorAll("img")]
      .filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r; })))).catch(() => {});
    await page.waitForTimeout(ms);
  };
  const shot = async (name) => { await settle(); await page.screenshot({ path: `${OUT}/${name}.png` }); console.log("shot", name); };
  const tap = async (sel) => { try { await page.click(sel, { timeout: 6000 }); } catch { await page.click(sel, { timeout: 4000, force: true }); } await page.waitForTimeout(250); };
  // click first control matching aria-label / text (in-page → immune to occlusion)
  const jclick = async (re) => { await page.evaluate((src) => { const rx = new RegExp(src, "i"); const el = [...document.querySelectorAll("button,a,[role=button]")].find((e) => rx.test(e.getAttribute("aria-label") || "") || rx.test(e.textContent || "")); if (el) el.click(); }, re); await page.waitForTimeout(450); };
  const nav = async (n) => { await page.evaluate((i) => document.querySelectorAll('nav[aria-label="Main"] button')[i]?.click(), n); await page.waitForTimeout(550); };
  const onboard = async () => {
    await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
    await tap("text=Let's begin"); await tap("text=English"); await tap("text=My child");
    await tap("button:has-text('Continue')"); await tap("text=Right hand"); await tap("text=Regular");
    await page.fill("input", "Noora"); await tap("button:has-text('Continue')"); await page.waitForTimeout(800);
  };
  return { shot, tap, jclick, nav, onboard, page };
};

const step = async (name, fn) => { try { await fn(); } catch (e) { console.log(`SKIP ${name}: ${String(e).split("\n")[0]}`); } };

// ===== PASS 1: clean nav + modal screens (no camera) =====
{
  const { shot, jclick, nav, onboard, page } = mk(await newPage());
  await onboard();
  await shot("01-firstsign-watch");           // firstSign appears post-onboarding
  await jclick("^close$|close");              // close → Home
  await shot("02-home");
  await step("family", async () => { await nav(3); await shot("03-family"); await nav(0); });
  await step("progress", async () => { await nav(4); await shot("04-progress"); await nav(0); });
  await step("signs", async () => { await nav(2); await shot("05-allsigns"); await nav(0); });
  await step("settings", async () => { await jclick("^settings$|الإعدادات"); await shot("06-settings"); await jclick("^close$|close|^back$"); });
  await step("ai-info", async () => { await jclick("how the ai|how it works|الذكاء"); await shot("07-how-ai-works"); await jclick("^close$|close|^back$"); });
  await step("lesson", async () => { await nav(0); await jclick("first connections|^start$|begin|^ابدأ"); await page.waitForTimeout(700); await shot("08-lesson"); await jclick("^close$|close"); });
  await step("flag", async () => { await nav(3); await jclick("flag|need|نحتاج|أبلغ"); await page.waitForTimeout(500); await shot("09-flagpicker"); });
}

// ===== PASS 2: live camera + celebration (MediaPipe) =====
{
  const { shot, jclick, nav, onboard, page } = mk(await newPage());
  await onboard();
  await step("try", async () => { await jclick("now you try"); await page.waitForTimeout(1200); await shot("10-camera-try"); });
  await step("celebrate", async () => { await jclick("i signed it right|signed it|got it"); await page.waitForTimeout(700); await shot("11-celebration"); });
  await step("camera-screen", async () => { await jclick("keep going|continue"); await page.waitForTimeout(600); await nav(1); await shot("12-camera"); });
}

await browser.close();
console.log("done");
