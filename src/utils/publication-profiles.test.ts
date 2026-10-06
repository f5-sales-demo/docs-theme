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

describe('Statistics publication', () => {
  it('keeps English publication and the existing F5 branding', () => {
    expect(repositoryPublicationProfile('f5-sales-demo/statistics')).toMatchObject({
      locales: { en: { label: 'English', lang: 'en' } },
      defaultLocale: 'en',
    });
    expect(repositoryPublicationProfile('statistics')?.favicon).toBeUndefined();
  });
  it('places all 13 existing routes once in reading order with infrastructure last', () => {
    const sidebar = publicationSidebar('f5-sales-demo/statistics', []);
    expect(sidebar?.slice(0, 11)).toEqual([
      { slug: 'index' },
      { slug: 'access-logs' },
      { slug: 'service-graph' },
      { slug: 'origin-performance' },
      { slug: 'application-health' },
      { slug: 'api-discovery' },
      { slug: 'firewall-metrics' },
      { slug: 'security-events' },
      { slug: 'troubleshooting' },
      { slug: 'api-catalog' },
      { slug: 'setup' },
    ]);
    expect(sidebar?.[11]).toEqual({
      label: 'Infrastructure',
      collapsed: true,
      items: [{ slug: 'deployment' }, { slug: 'verification' }],
    });
    expect(sidebar).toHaveLength(12);
    const routes = sidebar?.flatMap((item) =>
      'slug' in item
        ? [item.slug]
        : 'items' in item
          ? item.items.map((child) => ('slug' in child ? child.slug : ''))
          : [],
    );
    expect(routes).toHaveLength(13);
    expect(new Set(routes).size).toBe(13);
  });
  it('preserves supplied fallback navigation for other repositories', () => {
    const fallback = [{ slug: 'index' }, { label: 'Existing', items: [{ slug: 'existing' }] }];
    for (const repo of ['observability', 'multi-cloud-networking', 'docs-theme', 'statistics-extra']) {
      expect(publicationSidebar(`f5-sales-demo/${repo}`, fallback)).toBe(fallback);
    }
  });
});
