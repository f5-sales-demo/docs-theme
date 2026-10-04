import { describe, expect, it } from 'vitest';
import { localizeEcosystemHref } from './localize-ecosystem-href';
import { publicationSidebar, repositoryPublicationProfile } from './publication-profiles';

describe('Canadian publication', () => {
  it('publishes only English and selects the flag favicon', () => {
    expect(repositoryPublicationProfile('f5-sales-demo/canada')).toMatchObject({
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

describe('publication profile sidebar', () => {
  it('makes the Canada article primary and keeps every existing reference URL', () => {
    const sidebar = publicationSidebar('f5-sales-demo/canada', []);
    expect(sidebar?.slice(0, 2)).toEqual([{ slug: 'index' }, { slug: 'use-case' }]);
    const reference = sidebar?.[2];
    expect(reference).toMatchObject({ label: 'Reference', collapsed: true });
    expect(JSON.stringify(reference)).toContain('architecture');
    expect(JSON.stringify(reference)).toContain('verification');
    expect(JSON.stringify(reference)).toContain('terraform');
    expect(JSON.stringify(reference)).toContain('presentation');
    expect(reference).toMatchObject({
      items: expect.arrayContaining([expect.objectContaining({ label: 'Maintenance', collapsed: true })]),
    });
    for (const slug of ['deployment', 'failover', 'troubleshooting', 'teardown']) {
      expect(JSON.stringify(reference)).toContain(`"${slug}"`);
    }
  });
  it('preserves fallback navigation for every repository without a sidebar profile', () => {
    const fallback = [{ label: 'Existing', slug: 'en/existing' }];
    expect(publicationSidebar('f5-sales-demo/multi-cloud-networking', fallback)).toBe(fallback);
    expect(publicationSidebar('f5-sales-demo/docs-theme', undefined)).toBeUndefined();
    expect(publicationSidebar('f5-sales-demo/canada', fallback)).not.toBe(fallback);
  });
});
