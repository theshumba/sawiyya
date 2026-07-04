// H12 — a forced render throw must show the bilingual recovery card, never a
// white screen. Rendered with plain react-dom in jsdom (no testing-library).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ErrorBoundary } from "./ErrorBoundary";

function Bomb(): never {
  throw new Error("boom");
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  // React logs caught boundary errors — keep test output clean.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe("ErrorBoundary (H12)", () => {
  it("renders children when nothing throws", () => {
    act(() => {
      root.render(
        <ErrorBoundary scope="app">
          <p>all fine</p>
        </ErrorBoundary>,
      );
    });
    expect(container.textContent).toContain("all fine");
  });

  it("a render throw shows the bilingual recovery card", () => {
    act(() => {
      root.render(
        <ErrorBoundary scope="app">
          <Bomb />
        </ErrorBoundary>,
      );
    });
    // EN + AR both present — the language pref may be part of what crashed
    expect(container.textContent).toContain("Something went wrong");
    expect(container.textContent).toContain("حدث خطأ ما");
    expect(container.textContent).toContain("Reload the app");
    // reset-data exists but only as the labelled last resort
    expect(container.textContent).toContain("last resort");
  });

  it('section scope offers "try again" which re-mounts the subtree', () => {
    let shouldThrow = true;
    function Flaky() {
      if (shouldThrow) throw new Error("transient");
      return <p>recovered</p>;
    }
    act(() => {
      root.render(
        <ErrorBoundary scope="section">
          <Flaky />
        </ErrorBoundary>,
      );
    });
    const retry = [...container.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Try again"),
    );
    expect(retry).toBeDefined();
    shouldThrow = false;
    act(() => retry!.click());
    expect(container.textContent).toContain("recovered");
  });
});
