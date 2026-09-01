import notes from "../data/trackRequests.json";

/**
 * Radio call-in note per track (World Bible §8 — The Late Static request board).
 * Missing keys degrade to null: new tracks without copy yet simply show nothing.
 */
export function trackRequest(trackId: string): string | null {
  return (notes as Record<string, string>)[trackId] ?? null;
}
