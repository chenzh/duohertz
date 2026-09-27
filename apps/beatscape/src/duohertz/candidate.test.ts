import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DUOHERTZ_CANDIDATE_ENTRIES } from "./candidate";
import { parseDuohertzChart } from "./chart";

const stagedRoot = new URL("../../candidates/duohertz/", import.meta.url);

describe("staged duohertz candidate registry", () => {
  it("discovers every manifest and loads its own three playable charts", () => {
    const directories = readdirSync(stagedRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && /^dh-\d{3}-/.test(entry.name))
      .map((entry) => entry.name).sort();
    expect(DUOHERTZ_CANDIDATE_ENTRIES.map(([id]) => id)).toEqual(directories);

    for (const [trackId, staged] of DUOHERTZ_CANDIDATE_ENTRIES) {
      const directory = new URL(`${trackId}/`, stagedRoot);
      const manifest = JSON.parse(readFileSync(new URL("manifest.json", directory), "utf8"));
      expect(staged).toMatchObject({ title: manifest.title, artist: manifest.artist,
        subgenre: manifest.subgenre, bpm: manifest.bpm,
        durationMs: manifest.duration_sec * 1000, streamDurationMs: manifest.stream_duration_sec * 1000 });
      expect(staged.audioUrl).toContain("audio.m4a");
      expect(staged.streamUrl).toContain("stream.m4a");
      expect(staged.streamReady).toBe(manifest.stream_duration_sec >= manifest.duration_sec * 1.8
        && manifest.files_sha256["audio.m4a"] !== manifest.files_sha256["stream.m4a"]);
      expect(staged.coverUrl).toMatch(/cover-art\.png|^data:image\/png/);
      for (const tier of ["easy", "standard", "hard"] as const) {
        const chart = parseDuohertzChart(JSON.parse(readFileSync(new URL(`${tier}.json`, directory), "utf8")));
        expect(staged.charts[tier]).toEqual(chart);
        expect(chart).toMatchObject({ format: 2, theme: "duohertz", track_id: trackId, tier,
          input_count: tier === "easy" ? 1 : 2 });
      }
    }
  });
});
