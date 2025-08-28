// playwright.config.js
import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: path.join(__dirname, 'tests'),
  // default testMatch is fine; your *.spec.ts files already match
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
    // { name: 'chromium', use: { browserName: 'chromium' } }
  ]
});
