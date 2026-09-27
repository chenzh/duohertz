import { defineConfig, devices } from "@playwright/test";

// WebKit rejects port 4190 before sending a request; use a loopback port it accepts.
const port = 4187;

export default defineConfig({
  testDir: "./preview-e2e",
  outputDir: "./test-results-duohertz-preview",
  timeout: 20_000,
  expect: { timeout: 5_000 },
  workers: 1,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    ...devices["Desktop Chrome"],
    // Keep preview checks on loopback even if a page later adds an external asset.
    proxy: { server: "http://127.0.0.1:9", bypass: "127.0.0.1,localhost" },
    serviceWorkers: "block",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `VITE_DUOHERTZ_PREVIEW=1 node_modules/.bin/vite preview --host 127.0.0.1 --port ${port} --strictPort --outDir dist-duohertz`,
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: !process.env.CI,
  },
});
