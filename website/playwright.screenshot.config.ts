import { defineConfig, devices, ViewportSize } from '@playwright/test';

interface ScreenshotConfig {
  testDir: string;
  timeout: number;
  use: {
    baseURL: string;
    trace: 'on-first-retry';
    screenshot: {
      mode: 'only-on-failure' | 'on' | 'off';
      fullPage: boolean;
    };
  };
  projects: {
    name: string;
    use: {
      viewport: ViewportSize;
      deviceScaleFactor: number;
    };
  }[];
  viewports: {
    desktop: ViewportSize;
    tablet: ViewportSize;
    mobile: ViewportSize;
  };
}

const config: ScreenshotConfig = {
  testDir: './tests/screenshots',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: {
      mode: 'on',
      fullPage: false,
    },
  },
  projects: [
    {
      name: 'desktop',
      use: {
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'tablet',
      use: {
        viewport: { width: 768, height: 1024 },
        deviceScaleFactor: 1,
      },
    },
    {
      name: 'mobile',
      use: {
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
      },
    },
  ],
  viewports: {
    desktop: { width: 1280, height: 720 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 390, height: 844 },
  },
};

export default config;