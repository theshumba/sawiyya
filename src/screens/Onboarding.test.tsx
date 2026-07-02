// M27 — landing→app handoff: first-run onboarding must honour ?lang=ar from
// the very first (splash) screen — Arabic copy + RTL — instead of opening two
// English LTR screens before the language step. Plain react-dom in jsdom.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Onboarding } from "./Onboarding";
import { t } from "../i18n";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  localStorage.clear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  window.history.pushState({}, "", "/");
  document.documentElement.lang = "en";
  document.documentElement.dir = "ltr";
});

describe("Onboarding ?lang handoff (M27)", () => {
  it("opens Arabic RTL from the splash when the landing passes ?lang=ar", () => {
    window.history.pushState({}, "", "/?lang=ar");
    act(() => root.render(<Onboarding />));
    expect(container.textContent).toContain(t("obWelcomeTitle", "ar"));
    expect(document.documentElement.dir).toBe("rtl");
    expect(document.documentElement.lang).toBe("ar");
  });

  it("defaults to English LTR without the param", () => {
    act(() => root.render(<Onboarding />));
    expect(container.textContent).toContain(t("obWelcomeTitle", "en"));
    expect(document.documentElement.dir).toBe("ltr");
  });
});
