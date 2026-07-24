import { defineConfig, devices } from '@playwright/test';

const usePublicStack = process.env.OPENMAIC_E2E_PUBLIC === '1';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'html' : 'list',
  use: {
    baseURL: usePublicStack ? 'https://openmaic.devstudios.me' : 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: usePublicStack ? undefined : [
    {
      command: 'cd teacher && pnpm dev',
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { PORT: '3001' },
    },
    {
      command: 'cd student && pnpm dev',
      url: 'http://localhost:3002',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { PORT: '3002' },
    },
  ],
});