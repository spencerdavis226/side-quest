import { defineConfig, devices } from "@playwright/test";
const port = process.env.TEST_PORT || "4173";
const base = process.env.BASE_PATH || "/";
export default defineConfig({
  testDir: "tests/browser",
  outputDir: "test-results/game",
  fullyParallel: true,
  // No retries: the specs are deterministic (seeded randomness, Reduced
  // Motion, waits on state; tests/browser/support.ts), so a failure is a bug
  // to fix, not noise to retry past.
  retries: 0,
  use: {
    baseURL: `http://127.0.0.1:${port}${base}`,
    trace: "retain-on-failure",
    // The app honours Reduced Motion by settling every flip, deal and
    // banner at once, so tests wait on state, not on animations. Specs that
    // test motion opt back in (`test.use(motion)` from tests/browser/support).
    reducedMotion: "reduce",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
    { name: "webkit", use: { ...devices["iPhone 13"] } },
  ],
  webServer: {
    command: `npm run preview -- --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}${base}`,
    reuseExistingServer: !process.env.CI,
  },
});
