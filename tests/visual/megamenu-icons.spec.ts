import { expect, type Page, type TestInfo, test } from '@playwright/test';

const themes = ['dark', 'light'] as const;
const expectedIconCount = 34;

function setTheme(theme: 'dark' | 'light') {
  return `
    localStorage.setItem('starlight-theme', '${theme}');
  `;
}

async function applyTheme(page: Page, theme: 'dark' | 'light') {
  await page.evaluate((selectedTheme) => {
    document.documentElement.setAttribute('data-theme', selectedTheme);
  }, theme);
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
}

function captureBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

async function expectRenderedIcons(page: Page, selector: string, expectedCount: number) {
  const icons = page.locator(selector);
  await expect(icons).toHaveCount(expectedCount);
  for (const icon of await icons.all()) {
    await expect(icon).toBeVisible();
    const box = await icon.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    expect(box?.height).toBeGreaterThan(0);
    await expect(icon).toHaveAttribute('aria-hidden', 'true');

    const tagName = await icon.evaluate((element) => element.tagName);
    if (tagName === 'IMG') {
      await expect(icon).toHaveAttribute('alt', '');
      await expect(icon).toHaveAttribute('src', /^data:image\/svg\+xml,/);
    } else {
      await expect(icon).toHaveCSS('background-color', /rgba?\(/);
      expect(await icon.evaluate((element) => getComputedStyle(element).maskImage)).toContain('data:image/svg+xml');
    }
  }
}

async function saveRepresentativeScreenshots(page: Page, testInfo: TestInfo, prefix: string) {
  const branded = page.locator('.smm-svg-image').first().locator('xpath=..');
  const monochrome = page.locator('.smm-svg-mask').first().locator('xpath=..');
  const brandedImage = await branded.screenshot({ path: testInfo.outputPath(`${prefix}-branded.png`) });
  const monochromeImage = await monochrome.screenshot({ path: testInfo.outputPath(`${prefix}-monochrome.png`) });
  expect(brandedImage.byteLength).toBeGreaterThan(0);
  expect(monochromeImage.byteLength).toBeGreaterThan(0);
}

for (const theme of themes) {
  test(`all desktop megamenu icons render in ${theme} mode`, async ({ page }, testInfo) => {
    const browserErrors = captureBrowserErrors(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(setTheme(theme));
    const response = await page.goto('astro-config/', { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);
    await applyTheme(page, theme);

    const triggers = page.locator('.smm-trigger');
    await expect(triggers).toHaveCount(6);
    let renderedCount = 0;
    for (let index = 0; index < 6; index += 1) {
      await triggers.nth(index).focus();
      await triggers.nth(index).press('Enter');
      const panel = page.locator('.smm-viewport[data-state="open"] .smm-content');
      await expect(panel).toBeVisible();
      const panelIcons = panel.locator('.smm-link-icon');
      const panelCount = await panelIcons.count();
      await expectRenderedIcons(page, '.smm-viewport[data-state="open"] .smm-link-icon', panelCount);
      for (const icon of await panelIcons.all()) {
        await expect(icon).toHaveCSS('width', '40px');
        await expect(icon).toHaveCSS('height', '40px');
      }
      renderedCount += panelCount;

      if (index === 2) {
        await saveRepresentativeScreenshots(page, testInfo, `desktop-${theme}-${index}`);
        const monochromeIcon = panel.locator('.smm-svg-mask').first();
        const restingColor = await monochromeIcon.evaluate((element) => getComputedStyle(element).backgroundColor);
        await monochromeIcon.locator('xpath=..').hover();
        await expect(monochromeIcon).not.toHaveCSS('background-color', restingColor);
      }
    }
    expect(renderedCount).toBe(expectedIconCount);
    expect(browserErrors).toEqual([]);
  });

  test(`all mobile megamenu icons render in ${theme} mode`, async ({ page }, testInfo) => {
    const browserErrors = captureBrowserErrors(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(setTheme(theme));
    const response = await page.goto('astro-config/', { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);
    await applyTheme(page, theme);

    await page.locator('.smm-mobile-button').click();
    await page.locator('.smm-mobile-section').evaluateAll((sections) => {
      for (const section of sections) section.setAttribute('open', '');
    });
    await expectRenderedIcons(page, '.smm-mobile-link-icon', expectedIconCount);
    await saveRepresentativeScreenshots(page, testInfo, `mobile-${theme}`);
    expect(browserErrors).toEqual([]);
  });
}
