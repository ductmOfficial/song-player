import { defineConfig, devices } from "@playwright/test";

const PORT = 3400;

/**
 * E2E runs against a production build with the Audius API mocked
 * (AUDIUS_MOCK=1, see src/mocks). Run `pnpm build` first.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    locale: "vi-VN",
    trace: "retain-on-failure",
    // The worker would fetch streams itself, past page.route() mocks; pwa.spec opts back in.
    serviceWorkers: "block",
    // CI uses the Chrome that the runner image ships; locally, Playwright's Chromium.
    ...(process.env.CHROME_PATH && { launchOptions: { executablePath: process.env.CHROME_PATH } }),
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobile\.spec\.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: {
    command: `pnpm start --port ${String(PORT)}`,
    url: `http://localhost:${String(PORT)}`,
    env: { AUDIUS_MOCK: "1" },
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
