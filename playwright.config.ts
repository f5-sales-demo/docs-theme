import { defineConfig } from "@playwright/test";

const baseURL =
  process.env.BASE_URL ??
  "https://f5xc-salesdemos.github.io/docs-theme";

export default defineConfig({
  testDir: "tests/visual",
  timeout: 30_000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  use: {
    baseURL,
    browserName: "chromium",
    viewport: { width: 1280, height: 800 },
  },
});
