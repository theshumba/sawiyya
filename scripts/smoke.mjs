// Headless smoke test — boots the real app in Chromium, walks onboarding →
// home → lesson → family → progress → settings, fails on any console error.
// Camera/MediaPipe paths are exercised separately on-device (getUserMedia
// needs real hardware); everything else is covered here.
import { chromium } from "playwright-core";
import { homedir } from "os";
import { readdirSync } from "fs";
import { join } from "path";

const BASE = process.env.SMOKE_URL ?? "http://localhost:5173/";
const cacheDir = join(homedir(), "Library/Caches/ms-playwright");
const shell = readdirSync(cacheDir)
  .filter((d) => d.startsWith("chromium_headless_shell-"))
  .sort()
  .at(-1);
const executablePath = join(
  cacheDir,
  shell,
  "chrome-headless-shell-mac-arm64/chrome-headless-shell",
);

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("pageerror", (err) => errors.push(String(err)));

const step = async (name, fn) => {
  try {
    await fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    console.log(`✗ ${name}: ${e.message.split("\n")[0]}`);
    process.exitCode = 1;
  }
};

await step("app loads", async () => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForSelector("text=sawiyya", { timeout: 10000 });
});

await step("splash → language pick", async () => {
  await page.click("text=Let's begin");
  await page.waitForSelector("text=English");
});

await step("language → why (EN)", async () => {
  await page.click("text=English");
  await page.waitForSelector("text=Who are you learning for?");
});

await step("why → hand", async () => {
  await page.click("text=My child");
  await page.waitForSelector("text=Which hand do you sign with?");
});

await step("hand → goal", async () => {
  await page.click("text=Right hand");
  await page.waitForSelector("text=Your daily goal");
});

await step("goal → name", async () => {
  await page.click("text=Regular");
  await page.waitForSelector("text=What should we call you?");
});

await step("name → first-sign flow", async () => {
  await page.fill("input", "Noora");
  await page.click("text=Continue");
  await page.waitForSelector("text=I love you");
});

await step("first-sign: watch step shows demo + placeholder label", async () => {
  await page.waitForSelector("text=Demo placeholder");
});

await step("first-sign: try step opens camera UI (graceful no-cam)", async () => {
  await page.click("text=Now you try");
  // headless shell has no camera — the never-hard-fail self-mark must still be there
  await page.waitForSelector("text=I signed it right", { timeout: 15000 });
});

await step("self-mark → celebration (never-hard-fail)", async () => {
  await page.click("text=I signed it right");
  await page.waitForSelector("text=Connection made");
});

await step("celebration → home dashboard", async () => {
  await page.click("text=Keep going");
  await page.waitForSelector("text=Today's lesson");
  await page.waitForSelector("text=Daily goal");
});

await step("home shows streak + XP from first sign", async () => {
  await page.waitForSelector("text=day streak");
});

await step("lesson player runs a full drill loop", async () => {
  await page.click("text=First connections");
  await page.waitForSelector("text=A new sign");
  // walk up to 14 drills: watch→continue, choice→pick correct-ish then continue
  for (let i = 0; i < 14; i++) {
    if (await page.isVisible("text=Lesson complete!")) break;
    if (await page.isVisible("text=I signed it right")) {
      await page.click("text=I signed it right"); // camera drill in headless
      continue;
    }
    const continueBtn = page.locator("button:has-text('Continue')").last();
    if (await continueBtn.isEnabled()) {
      await continueBtn.click();
    } else {
      // a choice drill — tap the first option, then continue
      await page.locator("main button.rounded-2xl.border-2").first().click();
      await continueBtn.click();
    }
    await page.waitForTimeout(150);
  }
  await page.waitForSelector("text=Lesson complete!", { timeout: 5000 });
});

await step("lesson end card → home", async () => {
  await page.click("text=Back home");
  await page.waitForSelector("text=Today's lesson");
});

await step("family: add Deaf member + flag a sign", async () => {
  await page.click("nav >> text=Family");
  await page.waitForSelector("text=Household streak");
  await page.click("text=Add a family member");
  await page.fill("input", "Layla");
  await page.click("button:has-text('🧏')");
  await page.click("button:has-text('Save')");
  await page.waitForSelector("text=Layla");
  // switch to Layla and flag
  await page.click("text=Layla");
  await page.click("button:has-text('Flag signs we need')");
  await page.waitForSelector("text=Pick the signs");
  await page.click("button:has-text('Bedtime')");
  await page.click("button:has-text('Save')");
  await page.waitForSelector("text=Household streak");
});

await step("flag pins to hearing member's home", async () => {
  // switch back to Noora
  await page.click("text=Noora");
  await page.click("nav >> text=Home");
  await page.waitForSelector("text=Flagged for your family");
  await page.waitForSelector("text=needs this");
});

await step("progress screen", async () => {
  await page.click("nav >> text=Progress");
  await page.waitForSelector("text=signs mastered");
});

await step("settings + transparency + privacy + RTL switch", async () => {
  await page.click("nav >> text=Home");
  await page.click("[aria-label='Settings']");
  await page.waitForSelector("text=Signing hand");
  await page.click("text=What the AI can and can't do");
  await page.waitForSelector("text=What it can NOT do");
  await page.click("[aria-label='Back']");
  await page.click("text=Privacy");
  await page.waitForSelector("text=No video ever leaves your device");
  await page.click("[aria-label='Back']");
  // switch to Arabic → document must flip to RTL
  await page.click("button:has-text('عربي')");
  await page.waitForFunction(() => document.documentElement.dir === "rtl");
  await page.waitForSelector("text=الإعدادات");
  // back to EN
  await page.click("button:has-text('EN')");
  await page.waitForFunction(() => document.documentElement.dir === "ltr");
});

await step("state persists across reload", async () => {
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("text=Today's lesson");
  await page.waitForSelector("text=day streak");
});

const fatal = errors.filter(
  (e) =>
    !e.includes("getUserMedia") && // no camera in headless shell — expected
    !e.includes("Camera error") &&
    !e.includes("Requested device not found") &&
    !e.includes("mediapipe") &&
    !e.toLowerCase().includes("wasm") &&
    !e.includes("Failed to load resource"), // CDN model fetch may be blocked offline
);
if (fatal.length) {
  console.log("\nConsole errors:");
  for (const e of fatal) console.log("  •", e.slice(0, 200));
  process.exitCode = 1;
} else {
  console.log("\nNo unexpected console errors.");
}

await browser.close();
