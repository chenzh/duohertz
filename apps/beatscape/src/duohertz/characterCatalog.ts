export type DuohertzApprovedCharacter = {
  id: string;
  name: string;
  title: string;
  role: "Attacker" | "Support" | "Buffer";
  region: string;
  height: string;
  identity: string;
  traits: string;
  quote: string;
  story: string;
  art: string;
  side_art: string;
  art_sha256: string;
  side_art_sha256: string;
  alt: string;
  side_alt: string;
};

export type DuohertzCharacterCatalog = {
  version: 1;
  brand: "duohertz";
  source_character_signoff_sha256: string;
  site_and_deployment_approval: true;
  characters: DuohertzApprovedCharacter[];
};

const ROLES = ["Attacker", "Support", "Buffer"] as const;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonempty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Shape and route guard only; release tooling must independently verify the signed evidence and asset hashes. */
export function parseApprovedDuohertzCharacters(value: unknown): DuohertzCharacterCatalog {
  if (!record(value) || value.version !== 1 || value.brand !== "duohertz"
    || !/^[a-f0-9]{64}$/.test(String(value.source_character_signoff_sha256))
    || value.site_and_deployment_approval !== true
    || !Array.isArray(value.characters) || value.characters.length !== 3) {
    throw new Error("Expected an approved three-character duohertz catalog");
  }

  const ids = new Set<string>();
  const names = new Set<string>();
  const roles = new Set<string>();
  for (const character of value.characters) {
    if (!record(character) || typeof character.id !== "string"
      || !/^dh-char-[a-z0-9-]+$/.test(character.id)
      || ids.has(character.id)
      || !nonempty(character.name) || names.has(character.name.trim().toLowerCase())
      || !ROLES.includes(character.role as typeof ROLES[number]) || roles.has(String(character.role))
      || ["title", "region", "height", "identity", "traits", "quote", "story", "alt", "side_alt"]
        .some((field) => !nonempty(character[field]))
      || character.art !== `/characters/${character.id}/front.png`
      || character.side_art !== `/characters/${character.id}/side.png`
      || !/^[a-f0-9]{64}$/.test(String(character.art_sha256))
      || !/^[a-f0-9]{64}$/.test(String(character.side_art_sha256))) {
      throw new Error("Invalid approved duohertz character");
    }
    ids.add(character.id);
    names.add(character.name.trim().toLowerCase());
    roles.add(String(character.role));
  }
  return value as DuohertzCharacterCatalog;
}

export async function loadApprovedDuohertzCharacters(url: string): Promise<DuohertzCharacterCatalog> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to load duohertz characters");
  return parseApprovedDuohertzCharacters(await response.json());
}
