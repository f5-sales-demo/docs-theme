import { expect, test } from '@playwright/test';

const pages = [
  { name: 'home', path: './' },
  { name: 'components', path: 'components/' },
  { name: 'colors', path: 'colors/' },
  { name: 'typography', path: 'typography/' },
  { name: 'code-blocks', path: 'code-blocks/' },
  { name: 'mermaid', path: 'diagrams/basic-diagrams/' },
];

const themes = ['dark', 'light'] as const;

function setTheme(theme: 'dark' | 'light') {
  return `
    document.documentElement.setAttribute('data-theme', '${theme}');
    localStorage.setItem('starlight-theme', '${theme}');
  `;
}

for (const pageInfo of pages) {
  for (const theme of themes) {
    test(`${pageInfo.name} — ${theme} mode`, async ({ page }) => {
      await page.addInitScript(setTheme(theme));
      const response = await page.goto(pageInfo.path, { waitUntil: 'networkidle' });

      expect(response?.status()).toBe(200);
      await expect(page.locator('main')).toBeVisible();
      await page.evaluate(setTheme(theme));
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await page.evaluate(() => document.fonts.ready);
      await expect(page).toHaveScreenshot(`${pageInfo.name}-${theme}.png`);
    });
  }
}
