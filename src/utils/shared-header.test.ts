import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('bundles menu config in shared clients instead of serialized island props', () => {
  const header = readFileSync(new URL('../../components/SharedHeader.astro', import.meta.url), 'utf8');
  expect(header).not.toContain('config={');
  expect(header).toContain('<ThemeSelect');
  expect(header).toContain('<LanguageSelect');
  expect(header).toContain('<SocialIcons');
  for (const name of ['SharedMegaMenu', 'SharedMegaMenuMobile']) {
    const client = readFileSync(new URL(`../../components/${name}.tsx`, import.meta.url), 'utf8');
    expect(client).toContain('virtual:starlight-mega-menu/config');
  }
});
