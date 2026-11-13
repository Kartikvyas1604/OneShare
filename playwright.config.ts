import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  retries: 1,
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    ...devices["Desktop Chrome"],
  },
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : {
        command: "npm run start",
        url: process.env.BASE_URL || "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
