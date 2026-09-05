import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', timeout: 30000, expect: { timeout: 7000 }, workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4180', channel: process.env.PLAYWRIGHT_CHANNEL, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    { command: 'npm run preview:portal', url: 'http://127.0.0.1:4180', reuseExistingServer: false },
    { command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4181 --strictPort', url: 'http://127.0.0.1:4181/demo/', reuseExistingServer: false, timeout: 60000 },
  ],
});
