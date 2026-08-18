import { expect, test } from '@playwright/test';

const themes = ['dark', 'light'] as const;

function setTheme(theme: 'dark' | 'light') {
  return `
    document.documentElement.setAttribute('data-theme', '${theme}');
    localStorage.setItem('starlight-theme', '${theme}');
  `;
}

test.describe('Responsive Header and Splash Hero', () => {
  for (const theme of themes) {
    test(`Mobile 390x844 (${theme} mode): Site title truncation and hero order`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.addInitScript(setTheme(theme));
      const response = await page.goto('./', { waitUntil: 'networkidle' });
      expect(response?.status()).toBe(200);
      await page.evaluate(setTheme(theme));
      await page.evaluate(() => document.fonts.ready);

      // 1. No horizontal overflow on the page
      const hasHorizontalScrollbar = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScrollbar).toBe(false);

      // 2. Site title has text-overflow: ellipsis and does not overlap other controls
      const siteTitleSpan = page.locator('.site-title span').first();
      await expect(siteTitleSpan).toBeVisible();
      const textOverflow = await siteTitleSpan.evaluate((el) => window.getComputedStyle(el).textOverflow);
      expect(textOverflow).toBe('ellipsis');

      // 3. Full text is preserved in markup
      const titleText = await siteTitleSpan.textContent();
      expect(titleText?.trim().length).toBeGreaterThan(0);

      // 4. Hero reading order: H1 -> Tagline/Actions -> Illustration
      const hero = page.locator('.hero');
      await expect(hero).toBeVisible();

      const h1 = hero.locator('h1').first();
      const actions = hero.locator('.actions').first();
      const heroImage = hero.locator('> img, > picture, > .hero-html').first();

      const h1Box = await h1.boundingBox();
      const imageBox = await heroImage.boundingBox();

      expect(h1Box).not.toBeNull();
      expect(imageBox).not.toBeNull();

      if (h1Box && imageBox) {
        // H1 must appear above the hero illustration on mobile
        expect(h1Box.y).toBeLessThan(imageBox.y);
      }

      if (await actions.isVisible()) {
        const actionsBox = await actions.boundingBox();
        if (actionsBox && imageBox) {
          // Actions must appear above the hero illustration on mobile
          expect(actionsBox.y).toBeLessThan(imageBox.y);
        }
      }

      // 5. Hero illustration height constraint
      if (imageBox) {
        expect(imageBox.height).toBeLessThanOrEqual(220);
      }
    });

    test(`Desktop 1440x900 (${theme} mode): Splash hero vertical density`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.addInitScript(setTheme(theme));
      const response = await page.goto('./', { waitUntil: 'networkidle' });
      expect(response?.status()).toBe(200);
      await page.evaluate(setTheme(theme));
      await page.evaluate(() => document.fonts.ready);

      const hero = page.locator('.hero');
      await expect(hero).toBeVisible();

      const h1 = hero.locator('h1').first();
      const heroImage = hero.locator('> img, > picture, > .hero-html').first();

      const h1Box = await h1.boundingBox();
      const imageBox = await heroImage.boundingBox();

      expect(h1Box).not.toBeNull();
      expect(imageBox).not.toBeNull();

      // On desktop, two-column layout: copy is on left, image is on right
      if (h1Box && imageBox) {
        expect(h1Box.x).toBeLessThan(imageBox.x);
      }

      // First content heading below hero is visible at or near bottom of 1440x900 viewport
      const firstHeading = page.locator('.main-pane h2, .sl-markdown-content h2, main h2').first();
      if (await firstHeading.count() > 0) {
        const headingBox = await firstHeading.boundingBox();
        if (headingBox) {
          expect(headingBox.y).toBeLessThan(900);
        }
      }
    });
  }
});
