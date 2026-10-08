import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/visual',
  testMatch: 'shared-shell.spec.ts',
  outputDir: '/tmp/f5-shared-playwright',
  workers: 3,
  use: { baseURL: process.env.BASE_URL || 'http://127.0.0.1:4388/docs-theme/en/' },
  projects: ['chromium', 'firefox', 'webkit'].map((browserName) => ({
    name: browserName,
    use: { browserName: browserName as 'chromium' | 'firefox' | 'webkit' },
  })),
});
