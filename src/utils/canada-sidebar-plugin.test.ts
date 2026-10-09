import { describe, expect, it, vi } from 'vitest';
import f5xcDocsTheme from '../../index';

function configuredComponents(repository: string) {
  const updateConfig = vi.fn();
  const setup = f5xcDocsTheme(repository).hooks?.['config:setup'];
  if (!setup) throw new Error('theme setup hook is missing');
  setup({
    config: { components: {} },
    updateConfig,
    addRouteMiddleware: vi.fn(),
    logger: { info: vi.fn() },
  } as never);
  return updateConfig.mock.calls[0][0].components;
}

describe('Canada-only sidebar override', () => {
  it('selects the linked stage sidebar for Canada', () => {
    expect(configuredComponents('f5-sales-demo/canada').Sidebar).toBe(
      '@f5-sales-demo/docs-theme/components/CanadaSidebar.astro',
    );
  });

  it('leaves other repositories on their existing sidebar', () => {
    expect(configuredComponents('f5-sales-demo/multi-cloud-networking')).not.toHaveProperty('Sidebar');
  });
});

describe('Statistics sidebar override', () => {
  it('selects the sidebar that restores the active reading path', () => {
    expect(configuredComponents('f5-sales-demo/statistics').Sidebar).toBe(
      '@f5-sales-demo/docs-theme/components/StatisticsSidebar.astro',
    );
  });
  it('preserves unrelated repository sidebars', () => {
    expect(configuredComponents('f5-sales-demo/statistics-extra')).not.toHaveProperty('Sidebar');
  });
});
