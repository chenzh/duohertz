import { afterEach, describe, expect, it, vi } from "vitest";
import type { CatalogTrack } from "../types/catalog";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

describe("full-track links", () => {
  it("opens the selected track on Scape Music's hash router", async () => {
    vi.stubEnv("VITE_STREAM_APP_URL", "https://scapemusic.pages.dev/");
    const { resolveStreamAppUrl, formatStreamDuration } = await import("./streamLink");
    expect(resolveStreamAppUrl({ track_id: "bs-s1-01" } as CatalogTrack)).toBe("https://scapemusic.pages.dev/#/track/bs-s1-01");
    expect(formatStreamDuration(119.9)).toBe("2:00");
  });

  it("preserves explicit per-track destinations", async () => {
    const { resolveStreamAppUrl } = await import("./streamLink");
    expect(resolveStreamAppUrl({ stream_app_url: "https://example.com/song" } as CatalogTrack)).toBe("https://example.com/song");
  });
});
