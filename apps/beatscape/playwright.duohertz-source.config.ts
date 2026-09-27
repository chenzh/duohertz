import { defineConfig, devices } from "@playwright/test";

const port = 4191;

export default defineConfig({
  testDir: "./source-e2e",
  outputDir: "./test-results-duohertz-source",
  timeout: 20_000,
  expect: { timeout: 5_000 },
  workers: 1,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    ...devices["Desktop Chrome"],
    proxy: { server: "http://127.0.0.1:9", bypass: "127.0.0.1,localhost" },
    serviceWorkers: "block",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `VITE_DUOHERTZ_RELEASE_SOURCE=1 node_modules/.bin/vite preview --host 127.0.0.1 --port ${port} --strictPort --outDir dist-duohertz-source`,
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: !process.env.CI,
  },
});
