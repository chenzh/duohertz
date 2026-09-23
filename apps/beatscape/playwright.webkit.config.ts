import { defineConfig, devices } from "@playwright/test";
import baseConfig from "./playwright.config";

/** Opt-in iPhone/WebKit gameplay regression; the default release matrix stays unchanged. */
export default defineConfig({
  ...baseConfig,
  projects: [
    { name: "mobile", use: { ...devices["iPhone 13"] } },
  ],
});
