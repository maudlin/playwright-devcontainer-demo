import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  reporter: [
    ["list"],
    ["./manual-csv-reporter.cjs"]
  ],
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  }
});
