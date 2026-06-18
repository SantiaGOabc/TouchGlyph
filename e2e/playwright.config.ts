import { defineConfig, devices } from '@playwright/test';
import type { SerenityFixtures, SerenityWorkerFixtures } from '@serenity-js/playwright-test';

export default defineConfig<SerenityFixtures, SerenityWorkerFixtures>({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['@serenity-js/playwright-test', {
      crew: [
        '@serenity-js/console-reporter',
        ['@serenity-js/serenity-bdd', { specDirectory: './tests' }],
        ['@serenity-js/core:ArtifactArchiver', { outputDirectory: './reports/serenity' }],
      ]
    }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on',
  },

  projects: [
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
  ],

  webServer: {
    command: 'npm run dev',
    cwd: '..\\frontend',
    port: 5173,
    timeout: 30000,
    reuseExistingServer: !process.env.CI,
  },
});
