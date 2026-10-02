import { expect, it } from 'vitest';
import { menuLocalizationPolicy } from './menu-localization';

it('routes archived desktop and mobile menu localization through the theme policy', () => {
  const plugin = menuLocalizationPolicy();
  for (const name of ['MegaMenu.tsx', 'MegaMenuMobile.tsx']) {
    expect(
      plugin.resolveId(
        '../libs/localize-ecosystem-href.ts',
        `/app/node_modules/@f5-sales-demo/starlight-mega-menu/components/${name}`,
      ),
    ).toMatch(/localize-ecosystem-href\.ts$/);
  }
  expect(plugin.resolveId('../libs/localize-ecosystem-href.ts', '/app/other.ts')).toBeUndefined();
});
