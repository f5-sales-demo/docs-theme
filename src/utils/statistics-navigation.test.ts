import { expect, it } from 'vitest';
import { localizeEcosystemHref } from './localize-ecosystem-href';

it('retains explicit English Statistics destinations', () => {
  for (const locale of ['en', 'fr', 'ar'])
    expect(localizeEcosystemHref('https://f5-sales-demo.github.io/statistics/en/', locale)).toBe(
      'https://f5-sales-demo.github.io/statistics/en/',
    );
});
