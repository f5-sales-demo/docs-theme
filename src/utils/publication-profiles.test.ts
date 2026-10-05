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
  it('orders four linked stages and covers all 14 pages once', () => {
    const sidebar = publicationSidebar('f5-sales-demo/canada', []);
    expect(sidebar?.[0]).toEqual({ slug: 'index' });
    const stages = sidebar?.slice(1) ?? [];
    expect(stages.map((stage) => ('label' in stage ? stage.label : ''))).toEqual([
      'Design',
      'Deploy',
      'Verify',
      'Operate',
    ]);
    const expected = [
      ['design', 'use-case', 'architecture'],
      ['deploy', 'deployment', 'terraform'],
      ['verify', 'presentation', 'verification'],
      ['operate', 'troubleshooting', 'failover', 'teardown'],
    ];
    const routes = ['index'];
    stages.forEach((stage, index) => {
      expect(stage).toMatchObject({ collapsed: true });
      if (!('items' in stage)) throw new Error('Canada stage must have items');
      const stageRoutes = stage.items.map((item) => {
        if (!('slug' in item)) throw new Error('Canada stage item must be a page');
        return item.slug;
      });
      expect(stageRoutes).toEqual(expected[index]);
      routes.push(...stageRoutes);
    });
    expect(new Set(routes).size).toBe(14);
    expect(routes).toHaveLength(14);
    expect(stages.every((stage) => 'label' in stage && stage.label.split(/\s+/).length <= 3)).toBe(true);
  });
  it('preserves fallback navigation for every repository without a sidebar profile', () => {
    const fallback = [{ label: 'Existing', slug: 'en/existing' }];
    expect(publicationSidebar('f5-sales-demo/multi-cloud-networking', fallback)).toBe(fallback);
    expect(publicationSidebar('f5-sales-demo/docs-theme', undefined)).toBeUndefined();
    expect(publicationSidebar('f5-sales-demo/canada', fallback)).not.toBe(fallback);
  });
});
