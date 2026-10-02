import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  workers: 1,
  use: { baseURL: "http://localhost:3100", channel: "chrome" },
  webServer: { command: "npm run dev -- -p 3100", url: "http://localhost:3100", reuseExistingServer: true, timeout: 120000 },
});
