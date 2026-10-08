import { expect, test } from '@playwright/test';

// Use BASE_URL pointing to the built sales portal; theme sample docs have no showcase.
test('showcase reflows and header controls remain reachable', async ({ page }) => {
  await page.goto('./');
  test.skip((await page.locator('.sales-showcase').count()) === 0, 'Requires the sales showcase build');
  for (const width of [320, 375, 390, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 812 });
    for (const theme of ['light', 'dark']) {
      await page.evaluate((value) => {
        document.documentElement.dataset.theme = value;
      }, theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(
        await page
          .locator('.sl-link-card')
          .evaluateAll((cards) => cards.every((card) => card.scrollHeight <= card.clientHeight + 2)),
      ).toBe(true);
    }
    await page.locator('button[data-open-modal]').click();
    await expect(page.locator('dialog[open]')).toBeVisible();
    await page.keyboard.press('Escape');
    if (width < 1440) {
      await page.getByRole('button', { name: 'Open navigation menu' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeFocused();
      await page.getByLabel('Display and language').click();
      await expect(page.locator('.preferences-panel')).toBeVisible();
      await page.keyboard.press('Escape');
    }
    if (width === 375) {
      const card = await page.locator('.sl-link-card').first().boundingBox();
      expect(card?.y).toBeLessThan(812);
    }
  }
  for (const name of ['Demos', 'Demo environment', 'Operations', 'Developer tools', 'Ecosystem', 'F5 services']) {
    const trigger = page.getByRole('button', { name, exact: true });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.smm-viewport')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  }
});
