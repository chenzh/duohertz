import { describe, expect, it } from "vitest";
import { normalizeTrackSearch, trackMatchesSearch } from "./trackSearch";

const track = {
  title: "Crème Voltage",
  artist: "Pulse Atlas",
  district: "Gridline",
  genre: "Hip-hop",
  bpm: 120,
  tags: ["Night-drive", "Bass"],
};

describe("track search", () => {
  it("ignores punctuation and Latin accents without dropping other scripts", () => {
    expect(normalizeTrackSearch("  Crème—Brûlée  ")).toBe("creme brulee");
    expect(normalizeTrackSearch("R&B / 星光")).toBe("r b 星光");
  });

  it("matches catalog fields and hyphenated genres with everyday spelling", () => {
    expect(trackMatchesSearch(track, "Night Drive", "hip hop")).toBe(true);
    expect(trackMatchesSearch(track, "Night Drive", "hiphop")).toBe(true);
    expect(trackMatchesSearch(track, "Night Drive", "creme voltage")).toBe(true);
    expect(trackMatchesSearch(track, "Night Drive", "120 bpm")).toBe(true);
    expect(trackMatchesSearch(track, "Night Drive", "night drive")).toBe(true);
    expect(trackMatchesSearch(track, "Night Drive", "&")).toBe(false);
  });

  it("recognizes R&B and EDM names without matching unrelated genres", () => {
    const rnb = { ...track, genre: "R&B" };
    const edm = { ...track, genre: "EDM" };
    expect(trackMatchesSearch(rnb, "Groove", "rnb")).toBe(true);
    expect(trackMatchesSearch(rnb, "Groove", "r and b")).toBe(true);
    expect(trackMatchesSearch(rnb, "Groove", "r'n'b")).toBe(true);
    expect(trackMatchesSearch(rnb, "Groove", "rhythm and blues")).toBe(true);
    expect(trackMatchesSearch(rnb, "Groove", "r&b")).toBe(true);
    expect(trackMatchesSearch(edm, "Battle", "electronic dance music")).toBe(true);
    expect(trackMatchesSearch(edm, "Battle", "rnb")).toBe(false);
  });

  it("combines title, genre and exact BPM terms in either order", () => {
    const edm = { ...track, title: "Scarlet Hour", genre: "EDM", bpm: 160 };
    expect(trackMatchesSearch(edm, "Battle", "edm 160")).toBe(true);
    expect(trackMatchesSearch(edm, "Battle", "160 edm")).toBe(true);
    expect(trackMatchesSearch(edm, "Battle", "160 scarlet")).toBe(true);
    expect(trackMatchesSearch(edm, "Battle", "scarlet edm")).toBe(true);
    expect(trackMatchesSearch(edm, "Battle", "60 bpm")).toBe(false);
    expect(trackMatchesSearch(edm, "Battle", "r&b")).toBe(false);
    expect(trackMatchesSearch(
      { ...track, title: "Ink Stomp Riff", district: "Chrome Yard", genre: "Rock" },
      "Battle",
      "chrome riff",
    )).toBe(false);
  });
});
