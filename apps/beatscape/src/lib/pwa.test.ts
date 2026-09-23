import { describe, expect, it } from "vitest";
import { pwaAssetUrl } from "./pwa";

describe("pwaAssetUrl", () => {
  it("keeps Cloudflare root deployment paths rooted", () => {
    expect(pwaAssetUrl("sw.js", "/")).toBe("/sw.js");
  });

  it("normalizes local sub-path deployments", () => {
    expect(pwaAssetUrl("/sw.js", "/beatscape")).toBe("/beatscape/sw.js");
    expect(pwaAssetUrl("manifest.webmanifest", "beatscape/")).toBe("/beatscape/manifest.webmanifest");
  });
});
