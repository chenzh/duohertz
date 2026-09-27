import { defineConfig, devices } from "@playwright/test";

const port = 4188;

export default defineConfig({
  testDir: "./lab-e2e",
  outputDir: "./test-results-duohertz-lab",
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
    command: `pnpm dev --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}/beatscape/`,
    reuseExistingServer: !process.env.CI,
  },
});
