// Capture current-UI screenshots for design review.
import { chromium } from "playwright-core";
import { homedir } from "os";
import { readdirSync, mkdirSync } from "fs";
import { join } from "path";

const cacheDir = join(homedir(), "Library/Caches/ms-playwright");
const shell = readdirSync(cacheDir).filter((d) => d.startsWith("chromium_headless_shell-")).sort().at(-1);
const executablePath = join(cacheDir, shell, "chrome-headless-shell-mac-arm64/chrome-headless-shell");

mkdirSync("/tmp/sawiyya-shots", { recursive: true });
const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const shot = (name) => page.screenshot({ path: `/tmp/sawiyya-shots/${name}.png` });

await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await shot("01-splash");
await page.click("text=Let's begin");
await page.click("text=English");
await shot("02-onboarding-why");
await page.click("text=My child");
await page.click("text=Right hand");
await page.click("text=Regular");
await page.fill("input", "Noora");
await page.click("text=Continue");
await shot("03-firstsign-watch");
await page.click("text=Now you try");
await page.waitForSelector("text=I signed it right", { timeout: 15000 });
await shot("04-camera-drill");
await page.click("text=I signed it right");
await shot("05-celebration");
await page.click("text=Keep going");
await shot("06-home");
await page.click("text=First connections");
await page.waitForSelector("text=A new sign");
await page.click("text=Continue");
await page.waitForTimeout(300);
await shot("07-lesson-choice");
await page.click("[aria-label='Close']"); // exit lesson — no bottom nav inside player
await page.click("nav >> text=Family");
await shot("08-family");
await page.click("nav >> text=Progress");
await shot("09-progress");
await browser.close();
console.log("done");
