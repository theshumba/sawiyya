// Landing→app language handoff (M27): the landing appends ?lang=ar, and the
// app's first-run default (onboarding + App shell + boot splash) honours it.
import { describe, expect, it } from "vitest";
import { langFromSearch } from "./i18n";

describe("langFromSearch (M27)", () => {
  it("reads ?lang=ar", () => {
    expect(langFromSearch("?lang=ar")).toBe("ar");
  });

  it("reads ?lang=en", () => {
    expect(langFromSearch("?lang=en")).toBe("en");
  });

  it("reads lang among other params", () => {
    expect(langFromSearch("?utm_source=landing&lang=ar")).toBe("ar");
  });

  it("returns null when absent", () => {
    expect(langFromSearch("")).toBeNull();
    expect(langFromSearch("?debug")).toBeNull();
  });

  it("rejects unknown values instead of guessing", () => {
    expect(langFromSearch("?lang=fr")).toBeNull();
    expect(langFromSearch("?lang=")).toBeNull();
  });
});
