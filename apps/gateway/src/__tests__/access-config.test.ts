import { describe, expect, it } from "vitest";
import { readAccessConfig } from "../lib/access-config.js";

const production = { NODE_ENV: "production", API_KEY: "production-primary-fixture" };

describe("production access configuration", () => {
  it("disables the Demo BFF and secondary key by default", () => {
    expect(readAccessConfig(production)).toMatchObject({
      demoBffEnabled: false,
      demoApiKey: "",
      apiKeyAlt: "",
    });
  });

  it.each([undefined, "", " ", "dev-api-key-change-me", "change-me-in-production", "test-key"])(
    "rejects missing or placeholder primary key %s",
    (API_KEY) => expect(() => readAccessConfig({ ...production, API_KEY })).toThrow("API_KEY"),
  );

  it("rejects a development secondary key even with a configured primary key", () => {
    expect(() => readAccessConfig({ ...production, API_KEY_ALT: "dev-api-key-alt" })).toThrow("API_KEY_ALT");
  });

  it.each([undefined, "", "dev-api-key-alt", "dev-demo-api-key", production.API_KEY, "secondary-fixture"])(
    "rejects missing, default, or shared Demo key %s",
    (DEMO_API_KEY) =>
      expect(() => readAccessConfig({
        ...production,
        API_KEY_ALT: "secondary-fixture",
        DEMO_BFF_ENABLED: "true",
        DEMO_API_KEY,
      })).toThrow("DEMO_API_KEY"),
  );

  it("allows explicit Demo activation with a separate key", () => {
    expect(readAccessConfig({
      ...production,
      DEMO_BFF_ENABLED: "true",
      DEMO_API_KEY: "demo-fixture",
    })).toMatchObject({ demoBffEnabled: true, demoApiKey: "demo-fixture" });
  });

  it("keeps local mock harness compatibility", () => {
    expect(readAccessConfig({ NODE_ENV: "test", API_KEY: "test-key", MOCK_WORKERS: "true" }))
      .toMatchObject({ demoBffEnabled: true, demoApiKey: "dev-demo-api-key" });
  });

  it("honors explicit disabling locally and rejects ambiguous activation values", () => {
    expect(readAccessConfig({ DEMO_BFF_ENABLED: "false" }).demoBffEnabled).toBe(false);
    expect(() => readAccessConfig({ ...production, DEMO_BFF_ENABLED: "yes" })).toThrow("DEMO_BFF_ENABLED");
  });
});
