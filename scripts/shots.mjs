// Capture phone-width screenshots of every screen, for design review.
//
// Rewritten 2026-08-01: the old script drove onboarding by tapping "Let's begin"
// and "Right hand". Both are gone (the welcome CTA is "Get started"; the
// handedness step was deleted in the coherence pass), so it crashed before its
// first shot. It also predates the hash router — screens are now addressable, so
// everything after onboarding is a goto, not a chain of taps that can drift.
//
// Usage:  BASE=http://localhost:4173/ node scripts/shots.mjs
import { chromium } from "playwright-core";
import { homedir } from "os";
import { readdirSync, mkdirSync } from "fs";
import { join } from "path";

const BASE = (process.env.BASE || "http://localhost:5173/").replace(/\/$/, "") + "/";
const OUT = process.env.OUT || "/tmp/sawiyya-shots";

const cacheDir = join(homedir(), "Library/Caches/ms-playwright");
const shell = readdirSync(cacheDir).filter((d) => d.startsWith("chromium_headless_shell-")).sort().at(-1);
const executablePath = join(cacheDir, shell, "chrome-headless-shell-mac-arm64/chrome-headless-shell");

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath,
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
});

// Every console error/warning and page exception, tagged with the shot that was
// on screen when it fired. A silent console is part of the gate.
const problems = [];
let current = "(boot)";

async function newPage() {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    permissions: ["camera"],
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  // The PWA registers a service worker and precaches ~20MB, so "networkidle"
  // never fires — every wait here is bounded and swallowed.
  page.setDefaultTimeout(8000);
  page.setDefaultNavigationTimeout(20000);
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") problems.push(`[${current}] console.${m.type()}: ${m.text()}`);
  });
  page.on("pageerror", (e) => problems.push(`[${current}] pageerror: ${String(e).split("\n")[0]}`));
  return page;
}

// Copy the onboarding chain needs, per language. Kept here rather than imported
// from i18n so a copy change that breaks the drive shows up as a loud failure.
const COPY = {
  en: {
    start: "Get started", meet: "Nice to meet you", lang: "English", cont: "Continue",
    cam: "Got it", recap: "Looks right", name: "Noora",
    // Picked before the plan screen is shot: an all-unselected day row is an
    // empty state, and a design review should see the screen in real use.
    days: ["Mon", "Thu"],
  },
  ar: {
    start: "لنبدأ", meet: "تشرّفنا", lang: "العربية", cont: "متابعة",
    cam: "فهمت", recap: "يبدو صحيحًا", name: "نورة",
    days: ["الاثنين", "الخميس"],
  },
};

const mk = (page) => {
  const settle = async (ms = 400) => {
    await page.waitForLoadState("load", { timeout: 5000 }).catch(() => {});
    // Wait for in-flight images, but never on a lazy image below the fold: it
    // stays !complete and fires nothing, which used to hang the run forever.
    await page
      .evaluate(() =>
        Promise.race([
          Promise.all(
            [...document.querySelectorAll("img")]
              .filter((i) => !i.complete && i.loading !== "lazy")
              .map((i) => new Promise((r) => { i.onload = i.onerror = r; })),
          ),
          new Promise((r) => setTimeout(r, 3000)),
        ]),
      )
      .catch(() => {});
    await page.waitForTimeout(ms);
  };

  const shot = async (name) => {
    current = name;
    await settle();
    await page.screenshot({ path: `${OUT}/${name}.png` });
    console.log("shot", name);
  };

  // Click the first button/link whose visible text or aria-label matches.
  // In-page so an overlay can never intercept, and it throws loudly when the
  // copy it is looking for no longer exists.
  const click = async (text) => {
    const hit = await page.evaluate((needle) => {
      const els = [...document.querySelectorAll("button,a,[role=button]")];
      const el = els.find(
        (e) =>
          (e.textContent || "").includes(needle) || (e.getAttribute("aria-label") || "").includes(needle),
      );
      if (el) el.click();
      return !!el;
    }, text);
    if (!hit) throw new Error(`no control matching "${text}"`);
    await page.waitForTimeout(300);
  };

  // Screen addresses (the hash router) — no tap chains to drift.
  const goto = async (hash) => {
    await page.evaluate((h) => { window.location.hash = h; }, hash);
    await page.waitForTimeout(500);
  };

  const onboard = async (lang = "en", { shots = false } = {}) => {
    const c = COPY[lang];
    await page.goto(BASE + (lang === "ar" ? "?lang=ar" : ""), { waitUntil: "domcontentloaded" });
    await page.waitForSelector("button", { timeout: 15000 });
    // Guard the known headless trap: chrome-headless-shell clamps its window to
    // ~500px, which fakes right-edge overflow. Playwright's device-metrics
    // override should give a true 390 — assert it rather than trust it.
    const w = await page.evaluate(() => document.documentElement.clientWidth);
    if (w !== 390) throw new Error(`layout viewport is ${w}px, not 390 — screenshots would lie`);
    // Phase 2 · ONE sequence, no branch:
    // splash · meet · lang · why · know · plan · reminders · recap · name · camera
    // Picking the language advances straight to the first question — the track
    // chooser that used to sit here is gone.
    const p = shots ? (n) => shot(`${lang}-ob-${n}`) : async () => {};
    await p("1-splash");
    await click(c.start);
    await p("2-meet");
    await click(c.meet);
    await p("3-language");
    await click(c.lang);
    await p("4-who");
    await click(c.cont);
    await p("5-know");
    await click(c.cont);
    // Answer the days question before shooting it, so the screenshot shows the
    // screen as a learner leaves it rather than untouched.
    for (const d of c.days) await click(d);
    await p("6-plan");
    await click(c.cont);
    await p("7-reminder");
    await click(c.cont);
    await p("8-recap");
    await click(c.recap);
    await p("9-name");
    await page.fill("input", c.name);
    await click(c.cont);
    await p("10-camera");
    await click(c.cam); // terminal: creates the profile and opens FirstSign
    await page.waitForTimeout(900);
  };

  return { shot, click, goto, onboard, page };
};

const step = async (name, fn) => {
  try {
    await fn();
  } catch (e) {
    const line = `SKIP ${name}: ${String(e).split("\n")[0]}`;
    console.log(line);
    problems.push(line);
  }
};

// Screens reachable straight from an address, once a profile exists.
const ROUTES = [
  ["home", "#/"],
  ["practise", "#/practise"],
  // Phase 4: still an address, but it is the dictionary filtered to the
  // everyday words now, not a screen of its own.
  ["dictionary-words", "#/words"],
  ["fingerspell", "#/fingerspell"],
  ["dictionary", "#/signs"],
  ["dictionary-sign", "#/signs/alpha-alif"],
  ["family", "#/family"],
  ["flags", "#/flags"],
  ["progress", "#/progress"],
  ["settings", "#/settings"],
  ["ai-transparency", "#/ai"],
  ["privacy", "#/privacy"],
  ["first-sign", "#/first-sign"],
];

// ===== PASS 1 · English, every addressable screen (no camera) =====
{
  const { shot, goto, onboard } = mk(await newPage());
  await onboard("en", { shots: true });
  await shot("en-10-landing");
  for (const [name, hash] of ROUTES) {
    await step(name, async () => {
      await goto(hash);
      await shot(`en-${name}`);
    });
  }
}

// ===== PASS 2 · Arabic RTL, fresh profile (?lang=ar only bites at the splash) =====
{
  const { shot, goto, onboard } = mk(await newPage());
  await onboard("ar", { shots: true });
  await shot("ar-10-landing");
  for (const [name, hash] of ROUTES) {
    await step(`ar-${name}`, async () => {
      await goto(hash);
      await shot(`ar-${name}`);
    });
  }
}

// ===== PASS 3 · live camera + lesson (MediaPipe, isolated) =====
{
  const { shot, goto, onboard, page } = mk(await newPage());
  await onboard("en");
  await step("camera", async () => {
    await goto("#/camera/alpha-alif");
    await page.waitForTimeout(2500); // model load
    await shot("en-camera");
  });
  await step("lesson", async () => {
    await goto("#/lesson/alpha-u1-l1");
    await page.waitForTimeout(2000);
    await shot("en-lesson-alphabet");
  });
  // Phase 1 put the path in order, so a fresh learner CANNOT reach the words
  // lesson — this address now renders the locked refusal. The shot kept its old
  // "lesson-words" name for one run and showed a padlock captioned as the words
  // lesson, which is exactly the kind of quietly-wrong artefact a design review
  // trusts. Name it for what it is. The drill chrome itself is already covered
  // by en-lesson-alphabet; only the content differs.
  await step("lesson-locked", async () => {
    await goto("#/lesson/a1-u1-l1");
    await page.waitForTimeout(2000);
    await shot("en-lesson-locked");
  });
}

await browser.close();
console.log(`\n${problems.length ? problems.length + " problem(s):" : "clean: no console errors, no skipped screens"}`);
for (const p of problems) console.log("  " + p);
