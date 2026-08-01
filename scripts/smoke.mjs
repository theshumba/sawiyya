// Headless smoke test — boots the real app in Chromium and walks onboarding →
// first sign → home → lesson → family → dictionary → settings, failing on any
// console error.
//
// Rewritten 2026-08-01 (Phase 1). The previous version had rotted: it drove the
// onboarding by copy that three redesigns ago stopped existing ("Let's begin",
// "Who are you learning for?" as step 2, a "Daily goal" card on Home), so EVERY
// step failed on main and nobody noticed, because a failing harness looks the
// same as one nobody runs. This version drives by STRUCTURE — roles, aria
// attributes, and the handful of strings that carry product meaning — so a copy
// pass does not silently disarm it again.
//
// Not covered here, and said plainly rather than implied elsewhere: getUserMedia
// itself. Whether a real phone hands back a usable stream is the one genuinely
// on-device part. Grading is covered by `npm run verify:grading` (real MediaPipe
// over the 28 reference photos) and by normalize.test.ts in CI.
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

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
const bodyText = () => page.locator("body").innerText();
/** The screen's own primary action is the last visible button on every
 *  onboarding step (the shell's Skip link is first). */
const primary = () => page.locator("button:visible").last();
const tab = (label) => page.locator("nav button", { hasText: label }).first();

await step("app loads on the splash", async () => {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("text=Teach the world to sign", { timeout: 15000 });
});

await step("onboarding runs end to end without picking a track", async () => {
  // splash · guide · language · track · persona · camera · goal · reminder.
  // Picking nothing is deliberate: it is the route that reaches FirstSign.
  for (let i = 0; i < 8; i++) {
    await primary().click();
    await page.waitForTimeout(400);
  }
  await page.waitForSelector("text=What should we call you?");
});

await step("name → first sign", async () => {
  await page.fill("input", "Noora");
  await primary().click();
  // The first sign is whatever leads LESSONS, and since Phase 1 that is the
  // ALPHABET — so this screen teaches Alif, not the design mock's "I love you".
  // Anchor on the demo step's own title and on the fact that the caption
  // resolved a gloss at all, so reordering content cannot disarm the step.
  await page.waitForSelector("text=Watch it once", { timeout: 10000 });
  assert(
    (await bodyText()).includes("This sign means"),
    "the demo caption never resolved a gloss",
  );
});

await step("first sign: camera UI degrades gracefully with no camera", async () => {
  await primary().click(); // "Now you try"
  await page.waitForSelector("text=I signed it right", { timeout: 20000 });
});

await step("self-mark → celebration (never hard-fail)", async () => {
  await page.click("text=I signed it right");
  await page.waitForSelector("text=Connection made");
});

// ── Phase 1: Home is the trail, and nothing else ────────────────────────────
await step("celebration → home", async () => {
  await page.click("text=Keep going");
  await page.waitForSelector("text=Marhaba");
});

await step("home carries today's goal in the top bar, not a card", async () => {
  const txt = await bodyText();
  assert(/\d+ \/ \d+/.test(txt), "no n/m goal reading in the app bar");
  assert(txt.includes("today's goal"), "top bar does not label today's goal");
  assert(txt.includes("day streak"), "top bar lost the streak");
});

await step("home has NO secondary card stack under the trail", async () => {
  const txt = await bodyText();
  for (const gone of [
    "Practise the alphabet",
    "Everyday words",
    "Spell your name",
    "Daily goal",
    "Learn a new letter",
    "All caught up",
  ]) {
    assert(!txt.includes(gone), `Block D survivor on Home: "${gone}"`);
  }
});

await step("the trail is the screen: every lesson is a node", async () => {
  const nodes = page.locator("button[aria-haspopup='dialog']");
  assert((await nodes.count()) >= 8, "trail is missing nodes");
  await page.waitForSelector("text=The Arabic Alphabet");
  await page.waitForSelector("text=Family & First Words");
});

// ── Phase 1: the padlocks are real ───────────────────────────────────────────
await step("a locked node's sheet cannot be started", async () => {
  await page.locator("button[aria-haspopup='dialog']").nth(2).click();
  await page.waitForSelector("[role=dialog]");
  const cta = page.locator("[role=dialog] button").last();
  assert(await cta.isDisabled(), "a locked node offered a live action");
  assert(
    (await bodyText()).includes("Finish the lesson before this one"),
    "locked copy does not describe the rule the app enforces",
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
});

await step("the current node's sheet offers exactly one action", async () => {
  await page.locator("button[aria-haspopup='dialog']").first().click();
  await page.waitForSelector("[role=dialog]");
  const buttons = await page.locator("[role=dialog] button").allInnerTexts();
  assert(buttons.length === 1, `node sheet has ${buttons.length} actions, expected 1`);
  assert(
    !(await page.locator("[role=dialog]").innerText()).includes("Practise with camera"),
    "the node sheet is still a camera door",
  );
});

await step("deep-linking a locked lesson is refused, with a way forward", async () => {
  await page.goto(`${BASE}#/lesson/a1-u1-l1`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("text=Go to your lesson", { timeout: 10000 });
  const txt = await bodyText();
  assert(!txt.includes("A new sign"), "a locked lesson played its drills anyway");
  assert(txt.includes("Locked"), "the refusal does not say it is locked");
  await page.click("text=Go to your lesson");
  // It lands on the CURRENT lesson, whichever that is. Naming the id here would
  // re-couple the harness to content order — the thing that rotted it last time.
  await page.waitForFunction(
    () => location.hash.startsWith("#/lesson/") && !location.hash.includes("a1-u1-l1"),
    null,
    { timeout: 10000 },
  );
  // "Player is running" = one of its drill affordances is on screen. Which one
  // depends on the drill type: the alphabet opens on a camera drill, not a
  // watch card, so waiting for "A new sign" only ever passed by luck.
  await page
    .locator(
      "button:has-text('I signed it right'), button:has-text('Continue'), button:has-text('Check'), button:has-text('Re-teach')",
    )
    .first()
    .waitFor({ state: "visible", timeout: 15000 });
});

await step("lesson player runs a full drill loop", async () => {
  for (let i = 0; i < 16; i++) {
    if (await page.isVisible("text=Great session!")) break;
    if (await page.isVisible("text=Keep going")) break; // part-done card
    if (await page.isVisible("text=I signed it right")) {
      await page.click("text=I signed it right"); // camera drill in headless
      await page.waitForTimeout(200);
      continue;
    }
    const cta = page.locator("button:has-text('Continue'), button:has-text('Check')").last();
    if (await cta.isEnabled().catch(() => false)) {
      await cta.click();
    } else {
      await page.locator("main button").filter({ hasText: /·/ }).first().click();
      await cta.click();
    }
    await page.waitForTimeout(200);
  }
  assert(
    (await page.isVisible("text=Great session!")) || (await page.isVisible("text=Keep going")),
    "the lesson never reached an end card",
  );
});

await step("lesson end card → home", async () => {
  await page.click("text=Back home");
  await page.waitForSelector("text=Marhaba");
});

// ── Phase 1: the family request is the one card, and it sits on top ──────────
await step("family: add a Deaf member and flag a sign", async () => {
  await tab("Family").click();
  await page.waitForSelector("text=Your household");
  // The 74px tile truncates "Add a family member" to "Add", so the full label
  // survives only as the accessible name. Drive by role, not by the glyph.
  await page.getByRole("button", { name: "Add a family member" }).click();
  await page.getByRole("textbox", { name: "Name" }).fill("Layla");
  await page.click("button:has-text('🧏')");
  await page.click("button:has-text('Save')");
  await page.waitForSelector("text=Layla");
  await page.click("text=Layla"); // the member row is the profile switcher
  await page.waitForTimeout(400);
  await page.click("button:has-text('Flag signs we need')");
  await page.waitForSelector("text=You direct what they learn");
  // Milk sits in the Food group and the picker opens on Home, so the tile is
  // not on screen. Search for it instead of assuming which chip is selected.
  await page.getByRole("textbox", { name: "Search signs" }).fill("Milk");
  await page.locator("main button").filter({ hasText: "Milk" }).first().click();
  await page.waitForSelector("text=1 flagged");
  await page.locator("button").filter({ hasText: /^Done/ }).first().click();
  await page.waitForSelector("text=Your household");
});

await step("the flag lands ABOVE the trail on the learner's home", async () => {
  await page.click("text=Noora");
  await page.waitForTimeout(400);
  await tab("Learn").click();
  await page.waitForSelector("text=Flagged for your family");
  // The eyebrow is uppercased in CSS and innerText reports RENDERED text, so a
  // case-sensitive indexOf compares against a string that is never in the DOM
  // and "finds" it at -1 — which happens to be less than everything, and the
  // assert passes no matter where the card sits. Lowercase both sides.
  const txt = (await bodyText()).toLowerCase();
  const flag = txt.indexOf("flagged for your family");
  const trail = txt.indexOf("the arabic alphabet");
  assert(flag !== -1 && trail !== -1, "home lost the flag card or the trail");
  assert(flag < trail, "the family request is still below the trail");
  // Exactly one sign is flagged at this point, so the card has to say so in the
  // singular. It read "1 family requests".
  assert(
    txt.includes("1 family request") && !txt.includes("1 family requests"),
    "the promoted card does not count in the singular",
  );
});

// ── Phase 1: doors ──────────────────────────────────────────────────────────
await step("the dictionary's locked letters are locked", async () => {
  await tab("Signs").click();
  await page.waitForSelector("text=Sign Dictionary");
  await page.click("button[aria-label='Alphabet']");
  await page.waitForTimeout(400);
  const cells = page.locator("ul li button");
  assert(await cells.nth(0).isEnabled(), "the first letter should be open");
  assert(await cells.nth(20).isDisabled(), "a letter beyond lesson one is not locked");
  assert(
    (await bodyText()).includes("padlocked letters open with their lesson"),
    "the grid has no key for its three cell states",
  );
});

await step("settings: the permission status is a status, and rows are unique", async () => {
  await page.goto(`${BASE}#/settings`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("text=Camera permission");
  const txt = await bodyText();
  assert(
    (txt.match(/Manage profiles/g) ?? []).length === 1,
    "the duplicate Manage profiles row is back",
  );
  assert(!txt.includes("Privacy policy"), "the duplicate Privacy row is back");
  const statusButton = page.locator("button", { hasText: "Not granted yet" });
  assert((await statusButton.count()) === 0, "the permission STATUS is still a button");
});

await step("the AI explainer no longer opens the grader", async () => {
  await page.goto(`${BASE}#/ai`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("text=Let's Practice Together");
  await page.click("text=Let's Practice Together");
  await page.waitForTimeout(600);
  assert(page.url().includes("#/practise"), `landed on ${page.url()}, expected the Practise tab`);
});

await step("Arabic flips the document, and back", async () => {
  await page.goto(`${BASE}#/settings`, { waitUntil: "domcontentloaded" });
  await page.click("button:has-text('عربي')");
  await page.waitForFunction(() => document.documentElement.dir === "rtl");
  await page.waitForSelector("text=الإعدادات");
  await page.click("button:has-text('EN')");
  await page.waitForFunction(() => document.documentElement.dir === "ltr");
});

await step("state survives a reload", async () => {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("text=Marhaba");
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
  console.log(`\n✗ ${fatal.length} console error(s):`);
  for (const e of fatal.slice(0, 10)) console.log(`  ${e}`);
  process.exitCode = 1;
} else {
  console.log("\nNo unexpected console errors.");
}

await browser.close();
