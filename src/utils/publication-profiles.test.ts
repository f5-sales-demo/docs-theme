import { describe, expect, it } from 'vitest';
import { localizeEcosystemHref } from './localize-ecosystem-href';
import { repositoryPublicationProfile } from './publication-profiles';

describe('Canadian publication', () => {
  it('publishes only English and selects the flag favicon', () => {
    expect(repositoryPublicationProfile('f5-sales-demo/canada')).toEqual({
      locales: { en: { label: 'English', lang: 'en' } },
      defaultLocale: 'en',
      favicon: '/assets/canada-favicon.svg',
    });
    expect(repositoryPublicationProfile('f5-sales-demo/multi-cloud-networking')).toBeUndefined();
  });
  it('routes foreign-language ecosystem visitors to available English content', () => {
    expect(localizeEcosystemHref('https://f5-sales-demo.github.io/canada/', 'fr')).toBe(
      'https://f5-sales-demo.github.io/canada/en/',
    );
  });
});
