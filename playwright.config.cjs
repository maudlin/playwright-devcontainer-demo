// playwright.config.cjs
const { defineConfig } = require('@playwright/test');
const path = require('node:path');

module.exports = defineConfig({
  testDir: path.join(__dirname, 'tests'),
  testMatch: /.*\.spec\.(ts|js)/,
  reporter: [
    ['list'],
    [ path.join(__dirname, 'manual-csv-reporter.cjs') ]
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    { name: 'Edge', use: { browserName: 'chromium', channel: 'msedge' } },
    // { name: 'chromium', use: { browserName: 'chromium' } } // keep for later
  ]
});
