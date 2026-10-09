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
  it('preserves existing routes and places Shell Scripts before Infrastructure', () => {
    const sidebar = publicationSidebar('f5-sales-demo/statistics', []);
    expect(sidebar?.slice(0, 9)).toEqual([
      { slug: 'index' },
      { slug: 'access-logs' },
      { slug: 'service-graph' },
      { slug: 'origin-performance' },
      { slug: 'application-health' },
      { slug: 'api-discovery' },
      { slug: 'firewall-metrics' },
      { slug: 'security-events' },
      { slug: 'troubleshooting' },
    ]);
    const catalog = sidebar?.[9];
    expect(catalog).toMatchObject({ label: 'Statistics APIs', collapsed: true });
    if (!catalog || !('items' in catalog)) throw new Error('Statistics APIs must be a submenu');
    const expected = [
      'api-catalog',
      'api-catalog/query-concepts',
      'api-catalog/application-traffic',
      'api-catalog/api-analytics',
      'api-catalog/application-security',
      'api-catalog/bot-defense',
      'api-catalog/client-side-defense',
      'api-catalog/device-data-intelligence',
      'api-catalog/ddos-protection',
      'api-catalog/dns',
      'api-catalog/cdn',
      'api-catalog/networking',
      'api-catalog/kubernetes-storage',
      'api-catalog/logs-events-alerts',
      'api-catalog/synthetic-monitoring',
      'api-catalog/billing-usage',
    ];
    expect(catalog.items.map((item) => ('slug' in item ? item.slug : ''))).toEqual(expected);
    expect(catalog.items.every((item) => 'label' in item && item.label.split(/\s+/).length <= 3)).toBe(true);
    expect(catalog.items[0]).toEqual({ label: 'Overview', slug: 'api-catalog' });
    expect(catalog.items[1]).toEqual({ label: 'Query concepts', slug: 'api-catalog/query-concepts' });
    expect(sidebar?.[10]).toEqual({ slug: 'setup' });
    expect(sidebar?.[11]).toEqual({ slug: 'shell-scripts' });
    expect(sidebar?.[12]).toEqual({
      label: 'Infrastructure',
      collapsed: true,
      items: [{ slug: 'deployment' }, { slug: 'verification' }],
    });
    expect(sidebar).toHaveLength(13);
    const routes = sidebar?.flatMap((item) =>
      'slug' in item
        ? [item.slug]
        : 'items' in item
          ? item.items.map((child) => ('slug' in child ? child.slug : ''))
          : [],
    );
    expect(routes).toHaveLength(29);
    expect(new Set(routes).size).toBe(29);
  });
  it('preserves supplied fallback navigation for other repositories', () => {
    const fallback = [{ slug: 'index' }, { label: 'Existing', items: [{ slug: 'existing' }] }];
    for (const repo of ['observability', 'multi-cloud-networking', 'docs-theme', 'statistics-extra']) {
      expect(publicationSidebar(`f5-sales-demo/${repo}`, fallback)).toBe(fallback);
    }
  });
});
