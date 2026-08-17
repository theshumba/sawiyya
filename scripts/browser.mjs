import { existsSync } from "fs";
import { chromium } from "playwright";

const override = process.env.PLAYWRIGHT_EXECUTABLE_PATH;
const executablePath = override || chromium.executablePath();

if (!existsSync(executablePath)) {
  throw new Error(
    `Chromium executable not found at ${executablePath}. Run "npx playwright install chromium" or set PLAYWRIGHT_EXECUTABLE_PATH.`,
  );
}

export { chromium, executablePath };
