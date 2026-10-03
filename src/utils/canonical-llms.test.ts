import { describe, expect, it, vi } from 'vitest';

const read = vi.fn(() => ({ pages: [{}] }));
const write = vi.fn();
vi.mock('@f5-sales-demo/starlight-llms-txt/canonical-corpus', () => ({
  readCanonicalCorpus: read,
  writeCanonicalHierarchy: write,
}));
describe('canonical llms integration', () => {
  it('validates the original root before processing and streams after the build', async () => {
    const { default: integration } = await import('./canonical-llms.mjs');
    const plugin = integration({ contentRoot: '/fixture/documentation', base: '/preview/', title: 'Fixture' });
    expect(read).not.toHaveBeenCalled();
    plugin.hooks['astro:config:setup']();
    expect(read).toHaveBeenCalledWith('/fixture/documentation');
    plugin.hooks['astro:build:done']({ dir: new URL('file:///fixture/output/') });
    expect(write).toHaveBeenCalledWith({
      contentRoot: '/fixture/documentation',
      outputRoot: '/fixture/output/',
      base: '/preview/',
      title: 'Fixture',
    });
  });
});
