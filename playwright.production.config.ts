import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/production',
  testMatch: '**/*.pw.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 15 * 60_000,
  expect: { timeout: 20_000 },
  reporter: [['list']],
  use: {
    baseURL: process.env.PRODUCTION_BASE_URL?.trim() || 'https://devt.lat',
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
    headless: true,
    trace: 'retain-on-failure',
  },
});
