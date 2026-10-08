import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, type Page, test } from '@playwright/test';

const tree = path.resolve('../f5-sales-demo.github.io/shared');
const pointer = JSON.parse(readFileSync(path.join(tree, 'v1/current.json'), 'utf8'));
const origin = 'https://f5-sales-demo.github.io';
async function routeShared(page: Page, outage = false) {
  await page.route(`${origin}/shared/**`, async (route) => {
    const url = new URL(route.request().url());
    if (outage && url.pathname.endsWith('/current.json')) return route.fulfill({ status: 503, body: 'outage' });
    const file = path.join(tree, url.pathname.slice('/shared/'.length));
    const type = file.endsWith('.json')
      ? 'application/json'
      : file.endsWith('.js')
        ? 'text/javascript'
        : file.endsWith('.css')
          ? 'text/css'
          : file.endsWith('.woff2')
            ? 'font/woff2'
            : 'image/svg+xml';
    return route.fulfill({
      body: readFileSync(file),
      contentType: type,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  });
}
test.describe('shared shell', () => {
  for (const width of [375, 1440]) {
    test(`loads coordinated shell and preserves Escape focus at ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await routeShared(page);
      await page.goto('/docs-theme/en/');
      await expect(page.locator('html')).toHaveAttribute('data-f5-shared-release', pointer.release.sha256);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
      if (width < 1440) {
        const open = page.getByRole('button', { name: 'Open navigation menu' });
        await open.click();
        await expect(page.getByRole('dialog', { name: 'Menu', exact: true })).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(open).toBeFocused();
        await page.locator('.compact-preferences summary').click();
        await page.keyboard.press('Escape');
        await expect(page.locator('.compact-preferences summary')).toBeFocused();
      } else {
        const open = page.getByRole('button', { name: 'Demos', exact: true });
        await open.click();
        await expect(page.getByRole('link', { name: 'Web App & API Protection', exact: false }).first()).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(open).toBeFocused();
      }
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    });
  }
  test('warm-cache outage reuses verified release and annotates Search', async ({ page }) => {
    await routeShared(page);
    await page.goto('/docs-theme/en/');
    await expect(page.locator('html')).toHaveAttribute('data-f5-shared-release', pointer.release.sha256);
    await page.unroute(`${origin}/shared/**`);
    await routeShared(page, true);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-f5-shared-release', pointer.release.sha256);
    await page.evaluate(() => {
      const title = document.createElement('p');
      title.className = 'pagefind-ui__result-title';
      const link = document.createElement('a');
      link.className = 'pagefind-ui__result-link';
      link.href = 'https://f5-sales-demo.github.io/canada/en/';
      title.append(link);
      document.body.append(title);
    });
    await expect(page.locator('.search-project-source').last()).toHaveText('Canada topology');
  });
  test('Arabic RTL, reduced motion and enlarged text retain menu access', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await routeShared(page);
    await page.goto('/docs-theme/ar/');
    await expect(page.locator('html')).toHaveAttribute('data-f5-shared-release', pointer.release.sha256);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await page.getByRole('button', { name: /Open navigation menu|فتح/ }).click();
    await expect(page.locator('.smm-mobile-overlay')).toBeVisible();
    const canada = page.locator('.smm-mobile-link[href="https://f5-sales-demo.github.io/canada/en/"]');
    expect(await canada.count()).toBe(1);
  });
  test('root unavailable keeps readable documentation and directory link', async ({ page }) => {
    await page.route(`${origin}/shared/**`, (route) => route.abort());
    await page.goto('/docs-theme/en/');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('#f5-ecosystem-mobile a')).toHaveAttribute('href', `${origin}/en/ecosystem/`);
  });
  test('no JavaScript retains documentation and ecosystem navigation', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await routeShared(page);
    await page.goto(process.env.BASE_URL || 'http://127.0.0.1:44871/docs-theme/en/');
    await expect(page.locator('h1').first()).toBeVisible();
    expect(await page.getByRole('link', { name: 'Ecosystem directory', exact: true }).count()).toBeGreaterThan(0);
    await context.close();
  });
  test('unchanged consumer adopts a retained root-only rollback', async ({ page }) => {
    await routeShared(page);
    await page.goto('/docs-theme/en/');
    await expect(page.locator('html')).toHaveAttribute('data-f5-shared-release', pointer.release.sha256);
    const retained = 'e3434cae2b7a79b34171b674e9378cdf3bfe3965071ca9c9b231e2d819f035e4';
    const body = readFileSync(path.join(tree, 'v1/releases', `${retained}.json`));
    await page.route(`${origin}/shared/v1/current.json`, (route) =>
      route.fulfill({
        json: {
          contract: 'v1',
          release: { url: `${origin}/shared/v1/releases/${retained}.json`, sha256: retained, bytes: body.length },
        },
        headers: { 'Access-Control-Allow-Origin': '*' },
      }),
    );
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-f5-shared-release', retained);
  });
});
