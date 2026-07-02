// L16 — a corrupt SRS due date must self-heal to "due now", never become a
// silently never-due card (NaN <= x is always false).
import { describe, expect, it } from "vitest";
import { isDue, newStoredCard, rateCard } from "./srs";

describe("srs due-date self-heal (L16)", () => {
  it("treats an invalid due date as due now", () => {
    const card = { ...newStoredCard(), due: "not-a-date" };
    expect(isDue(card)).toBe(true);
  });

  it("keeps normal due semantics for valid dates", () => {
    const past = { ...newStoredCard(), due: new Date(Date.now() - 60_000).toISOString() };
    const future = { ...newStoredCard(), due: new Date(Date.now() + 86_400_000).toISOString() };
    expect(isDue(past)).toBe(true);
    expect(isDue(future)).toBe(false);
  });

  it("rating a card with a corrupt due date produces a valid schedule (no NaN)", () => {
    const corrupt = { ...newStoredCard(), due: "garbage" };
    const rated = rateCard(corrupt, "good");
    expect(Number.isFinite(new Date(rated.due).getTime())).toBe(true);
    expect(Number.isFinite(rated.stability)).toBe(true);
    expect(Number.isFinite(rated.difficulty)).toBe(true);
  });
});
