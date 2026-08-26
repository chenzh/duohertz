import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, getMessages } from "./index";

describe("leaderboard i18n (TICKET-B04)", () => {
  it("defaults to English locale", () => {
    expect(DEFAULT_LOCALE).toBe("en");
  });

  it("exposes empty-state copy in English", () => {
    const { emptyState } = getMessages("en").leaderboard;
    expect(emptyState).toContain("No scores yet");
    expect(emptyState).toMatch(/Arcade/i);
    expect(emptyState).not.toMatch(/global|worldwide/i);
  });

  it("has zh locale stub for leaderboard empty state", () => {
    const { emptyState } = getMessages("zh").leaderboard;
    expect(emptyState.length).toBeGreaterThan(0);
    expect(emptyState).not.toBe(getMessages("en").leaderboard.emptyState);
  });
});
