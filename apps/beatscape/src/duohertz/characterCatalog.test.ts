import { afterEach, describe, expect, it, vi } from "vitest";
import { loadApprovedDuohertzCharacters, parseApprovedDuohertzCharacters } from "./characterCatalog";

function fixture() {
  return {
    version: 1,
    brand: "duohertz",
    source_character_signoff_sha256: "a".repeat(64),
    site_and_deployment_approval: true,
    characters: (["Attacker", "Support", "Buffer"] as const).map((role, index) => {
      const id = `dh-char-${index + 1}`;
      return {
        id, name: `Fixture ${index + 1}`, title: "A new sound", role,
        region: "The Soundfield", height: "165 cm", identity: "Starts a new beat.",
        traits: "Curious · warm", quote: "Join the rhythm.", story: "A new friend joins the soundfield.",
        art: `/characters/${id}/front.png`, side_art: `/characters/${id}/side.png`,
        art_sha256: "a".repeat(64), side_art_sha256: "b".repeat(64),
        alt: `Front of Fixture ${index + 1}`, side_alt: `Side of Fixture ${index + 1}`,
      };
    }),
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("duohertz approved character boundary", () => {
  it("accepts three distinct characters with one of each role and isolated art paths", () => {
    const catalog = parseApprovedDuohertzCharacters(fixture());
    expect(catalog.characters).toHaveLength(3);
    expect(catalog.characters.map((character) => character.role)).toEqual(["Attacker", "Support", "Buffer"]);
  });

  it("rejects staged, legacy, incomplete, duplicate, and unsafe character data", () => {
    const staged = fixture();
    staged.site_and_deployment_approval = false;
    expect(() => parseApprovedDuohertzCharacters(staged)).toThrow(/approved/);

    const legacy = fixture();
    legacy.brand = "beatscape";
    expect(() => parseApprovedDuohertzCharacters(legacy)).toThrow(/duohertz/);

    const incomplete = fixture();
    incomplete.characters.pop();
    expect(() => parseApprovedDuohertzCharacters(incomplete)).toThrow(/three-character/);

    const duplicate = fixture();
    duplicate.characters[1].name = duplicate.characters[0].name.toLowerCase();
    expect(() => parseApprovedDuohertzCharacters(duplicate)).toThrow(/Invalid/);

    const duplicateRole = fixture();
    duplicateRole.characters[2].role = "Attacker";
    expect(() => parseApprovedDuohertzCharacters(duplicateRole)).toThrow(/Invalid/);

    const unsafeArt = fixture();
    unsafeArt.characters[0].art = "https://example.com/old-character.png";
    expect(() => parseApprovedDuohertzCharacters(unsafeArt)).toThrow(/Invalid/);

    const staleArt = fixture();
    staleArt.characters[0].art_sha256 = "not-a-hash";
    expect(() => parseApprovedDuohertzCharacters(staleArt)).toThrow(/Invalid/);
  });

  it("loads the approved file at its own URL and rejects missing evidence", async () => {
    const request = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({
      ...fixture(), source_character_signoff_sha256: "missing",
    }))).mockResolvedValueOnce(new Response(JSON.stringify(fixture())));
    vi.stubGlobal("fetch", request);
    await expect(loadApprovedDuohertzCharacters("/duohertz-v2/characters.json")).rejects.toThrow(/approved/);
    await expect(loadApprovedDuohertzCharacters("/duohertz-v2/characters.json")).resolves.toMatchObject({ brand: "duohertz" });
    expect(request).toHaveBeenCalledWith("/duohertz-v2/characters.json");
  });
});
