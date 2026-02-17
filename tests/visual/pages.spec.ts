import { test, expect } from "@playwright/test";

const pages = [
  { name: "home", path: "/" },
  { name: "components", path: "/09-components/" },
  { name: "colors", path: "/05-colors/" },
  { name: "typography", path: "/07-typography/" },
  { name: "code-blocks", path: "/08-code-blocks/" },
  { name: "mermaid", path: "/10-mermaid/" },
];

const themes = ["dark", "light"] as const;

function setTheme(theme: "dark" | "light") {
  return `
    document.documentElement.setAttribute('data-theme', '${theme}');
    localStorage.setItem('starlight-theme', '${theme}');
  `;
}

for (const pageInfo of pages) {
  for (const theme of themes) {
    test(`${pageInfo.name} — ${theme} mode`, async ({ page }) => {
      await page.goto(pageInfo.path, { waitUntil: "networkidle" });
      await page.evaluate(setTheme(theme));
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot(`${pageInfo.name}-${theme}.png`, {
        fullPage: true,
      });
    });
  }
}
