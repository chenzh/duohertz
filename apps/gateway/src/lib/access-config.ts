const DEVELOPMENT_API_KEY = "dev-api-key-change-me";
const DEVELOPMENT_DEMO_KEY = "dev-demo-api-key";
const PLACEHOLDER_KEYS = new Set([
  DEVELOPMENT_API_KEY,
  DEVELOPMENT_DEMO_KEY,
  "dev-api-key-alt",
  "change-me-in-production",
  "test-key",
]);

/** Keep production access checks independent of startup and database side effects. */
export function readAccessConfig(env: NodeJS.ProcessEnv) {
  const production = env.NODE_ENV === "production";
  const apiKey = env.API_KEY ?? (production ? "" : DEVELOPMENT_API_KEY);
  const apiKeyAlt = env.API_KEY_ALT ?? "";
  const enabled = env.DEMO_BFF_ENABLED;
  if (enabled !== undefined && enabled !== "true" && enabled !== "false") {
    throw new Error("DEMO_BFF_ENABLED must be true or false");
  }
  const demoBffEnabled = enabled === undefined ? !production : enabled === "true";
  const demoApiKey = demoBffEnabled ? env.DEMO_API_KEY ?? (production ? "" : DEVELOPMENT_DEMO_KEY) : "";

  if (production) {
    if (!apiKey.trim() || PLACEHOLDER_KEYS.has(apiKey.trim())) {
      throw new Error("Production requires a non-default API_KEY");
    }
    if (apiKeyAlt && (!apiKeyAlt.trim() || PLACEHOLDER_KEYS.has(apiKeyAlt.trim()))) {
      throw new Error("Production API_KEY_ALT must be empty or non-default");
    }
    if (demoBffEnabled && (!demoApiKey.trim() || PLACEHOLDER_KEYS.has(demoApiKey.trim()))) {
      throw new Error("Production Demo BFF requires a non-default DEMO_API_KEY");
    }
    if (demoBffEnabled && (demoApiKey === apiKey || demoApiKey === apiKeyAlt)) {
      throw new Error("DEMO_API_KEY must differ from API_KEY and API_KEY_ALT in production");
    }
  }

  return { apiKey, apiKeyAlt, demoBffEnabled, demoApiKey };
}
