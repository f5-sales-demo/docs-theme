import { describe, expect, it } from 'vitest';
import { defaultMegaMenuItems, federatedSearchBundlePaths, federatedSearchSites } from '../../config';
import { localizeEcosystemHref } from './localize-ecosystem-href';

describe('Statistics discovery', () => {
  it('lists Statistics beside monitoring tools exactly once', () => {
    const networking = defaultMegaMenuItems.find((item) => item.label === 'Operations');
    const category = networking?.content?.categories?.find((item) => item.title === 'Queries and administration');
    const statistics = category?.items?.filter((item) => item.label === 'Statistics');
    expect(statistics).toHaveLength(1);
    expect(statistics?.[0]).toMatchObject({
      href: 'https://f5-sales-demo.github.io/statistics/en/',
      description: 'Query access logs, application metrics, and security telemetry through the API.',
    });
    expect(category?.items?.map((item) => item.label)).toEqual(['Statistics', 'Observability', 'Administration']);
  });
  it('adds Statistics to federated search and avoids self-index duplication', () => {
    expect(federatedSearchSites.filter((item) => item.repo === 'statistics')).toHaveLength(1);
    expect(federatedSearchBundlePaths('https://f5-sales-demo.github.io', '/')).toContain(
      'https://f5-sales-demo.github.io/statistics/pagefind/',
    );
    expect(federatedSearchBundlePaths('https://f5-sales-demo.github.io', '/statistics')).not.toContain(
      'https://f5-sales-demo.github.io/statistics/pagefind/',
    );
  });
  it('keeps the published English destination for every reader locale', () => {
    for (const locale of ['en', 'fr', 'ja']) {
      expect(localizeEcosystemHref('https://f5-sales-demo.github.io/statistics/en/', locale)).toBe(
        'https://f5-sales-demo.github.io/statistics/en/',
      );
    }
  });
});
