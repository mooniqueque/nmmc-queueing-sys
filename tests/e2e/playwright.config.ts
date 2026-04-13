import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./",
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  use: {
    baseURL: process.env.TEST_FRONTEND_URL || "http://localhost:3000",
    trace: "on-first-retry"
  },
  reporter: [
    ["list"],
    ["html", { outputFolder: "../reports/playwright-html", open: "never" }]
  ]
});
