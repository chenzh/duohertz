import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RADIO_EPISODES, RADIO_SEASONS, SEASON_PREMIERE_MS } from "../data/radioEpisodes";
import { RadioDialogue } from "../pages/Radio";
import { episodeAirLabel, episodeIndexAt, episodeState } from "./radio";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

describe("broadcast transcripts", () => {
  it("renders each line with its own speaker instead of treating dialogue as plain text", () => {
    const html = renderToStaticMarkup(createElement(RadioDialogue, {
      lines: [
        { speaker: "ATLAS", text: "The relay is steady." },
        { speaker: "TORQUE", text: "Then we can play." },
      ],
    }));
    expect(html).toContain('aria-label="Broadcast transcript"');
    expect(html).toMatch(/data-speaker="ATLAS"[^>]*>.*?>ATLAS<.*?The relay is steady\./);
    expect(html).toMatch(/data-speaker="TORQUE"[^>]*>.*?>TORQUE<.*?Then we can play\./);
    expect(html).not.toContain("[object Object]");
  });
});

describe("episodeIndexAt", () => {
  it("clamps before the season premiere to the first episode", () => {
    expect(episodeIndexAt(SEASON_PREMIERE_MS - WEEK_MS)).toBe(0);
  });

  it("advances one episode per week", () => {
    expect(episodeIndexAt(SEASON_PREMIERE_MS + WEEK_MS)).toBe(1);
    expect(episodeIndexAt(SEASON_PREMIERE_MS + 3 * WEEK_MS)).toBe(3);
  });

  it("rolls over into the next season", () => {
    const s2 = RADIO_EPISODES.find((e) => e.season === 2);
    expect(s2).toBeDefined();
    expect(episodeIndexAt(SEASON_PREMIERE_MS + s2!.week * WEEK_MS)).toBe(
      RADIO_EPISODES.indexOf(s2!),
    );
  });

  it("clamps past the finale to the last episode", () => {
    expect(episodeIndexAt(SEASON_PREMIERE_MS + 99 * WEEK_MS)).toBe(RADIO_EPISODES.length - 1);
  });
});

describe("episodeState", () => {
  it("marks aired / now / upcoming around the current week", () => {
    const now = SEASON_PREMIERE_MS + 2 * WEEK_MS;
    expect(episodeState(1, now)).toBe("aired");
    expect(episodeState(2, now)).toBe("now");
    expect(episodeState(3, now)).toBe("upcoming");
  });
});

describe("air labels", () => {
  it("labels weeks within each season", () => {
    const s1 = RADIO_EPISODES[2];
    const s2First = RADIO_EPISODES.find((e) => e.season === 2)!;
    expect(episodeAirLabel(s1)).toBe("Week 3");
    expect(episodeAirLabel(s2First)).toBe("S2 · Week 1");
  });
});

describe("program invariants (World Bible tone guide)", () => {
  it("numbers episodes globally and sequentially", () => {
    RADIO_EPISODES.forEach((ep, i) => expect(ep.ep).toBe(i + 1));
  });

  it("declares every season in the metadata", () => {
    const seasons = new Set(RADIO_EPISODES.map((e) => e.season));
    for (const s of seasons) {
      expect(RADIO_SEASONS.some((meta) => meta.number === s)).toBe(true);
    }
  });

  it("schedules episodes in strictly increasing weeks without gaps", () => {
    RADIO_EPISODES.forEach((ep, i) => {
      expect(ep.week).toBe(i);
    });
  });

  it("never speaks the tower's true name more than 3 times per season", () => {
    for (const season of RADIO_SEASONS) {
      const copy = RADIO_EPISODES.filter((e) => e.season === season.number)
        .flatMap((e) => e.lines.map((line) => line.text))
        .join(" ");
      const mentions = copy.match(/monolith/gi)?.length ?? 0;
      expect(mentions).toBeLessThanOrEqual(3);
    }
  });

  it("avoids the banned tone words", () => {
    const copy = RADIO_EPISODES.flatMap((e) => [e.title, e.teaser, ...e.lines.map((line) => line.text), e.signoff]).join(" ");
    // word boundaries: "personal" must not trip the "persona" guard
    expect(copy).not.toMatch(/\bmask\b|\bpersona\b|\bvelvet\b|\bphantom\b|\bepic\b|\blegendary\b|\bwin big\b/i);
  });
});
