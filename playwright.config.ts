import { tmpdir } from 'node:os';
import path from 'node:path';
import { defineConfig } from '@playwright/test';

const externalBaseURL = process.env.BASE_URL;
const baseURL = externalBaseURL ?? 'http://127.0.0.1:4321/en/';

export default defineConfig({
  testDir: 'tests/visual',
  outputDir: path.join(tmpdir(), 'docs-theme-playwright-results'),
  timeout: 30_000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  use: {
    baseURL,
    browserName: 'chromium',
    viewport: { width: 1280, height: 800 },
  },
  webServer: externalBaseURL
    ? undefined
    : {
        command: 'npm run build && node scripts/run-astro-with-content.mjs preview --host 127.0.0.1 --port 4321',
        gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 },
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
