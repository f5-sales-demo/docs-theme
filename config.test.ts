import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createF5xcDocsConfig, progressiveCorpusPolicy } from './config';

describe('progressive corpus repository policy', () => {
  it('forwards only validated taxonomy and hint settings', () => {
    expect(
      progressiveCorpusPolicy({
        progressiveCorpus: {
          manifest: '/untrusted/manifest.json',
          contentRoot: '/untrusted/content',
          assetBaseUrl: 'https://untrusted.example/',
          taxonomy: {
            levels: ['category', 'subcategory'],
            collapseSingletonSubcategories: true,
          },
          hints: { strategy: 'first-sentence', maxCharacters: 240 },
        },
      }),
    ).toEqual({
      taxonomy: {
        levels: ['category', 'subcategory'],
        collapseSingletonSubcategories: true,
      },
      hints: { strategy: 'first-sentence', maxCharacters: 240 },
    });
  });

  it('rejects malformed semantic settings', () => {
    expect(() => progressiveCorpusPolicy({ progressiveCorpus: { taxonomy: { levels: ['path'] } } })).toThrow(
      /taxonomy/,
    );
    expect(() =>
      progressiveCorpusPolicy({ progressiveCorpus: { hints: { strategy: 'complete', maxCharacters: 0 } } }),
    ).toThrow(/hints/);
  });
});

describe('canonical provider profile', () => {
  it('enables native one MiB chunks and preserves the publication base', async () => {
    const { createF5xcDocsConfig } = await import('./config');
    const temporary = mkdtempSync(join(tmpdir(), 'provider-manifest-'));
    const manifest = join(temporary, 'manifest.json');
    writeFileSync(manifest, JSON.stringify({ files: { 'documentation/resources/demo/index.md': {} } }));
    const config = createF5xcDocsConfig({
      base: '/terraform-provider-xcsh/versions/v12.0.6/',
      canonicalProvider: {
        contentRoot: '/alternate/documentation',
        manifest,
        navigation: '/temporary/navigation.json',
        version: 'v12.0.6',
      },
    });
    expect(config.experimental?.collectionStorage).toEqual({ type: 'chunked', chunkSize: 1024 * 1024 });
    expect(config.base).toBe('/terraform-provider-xcsh/versions/v12.0.6/');
    expect(config.vite?.build?.assetsInlineLimit).toBe(0);
    expect(config.redirects).toEqual({ '/en/': '/terraform-provider-xcsh/versions/v12.0.6/' });
    rmSync(temporary, { recursive: true, force: true });
  });
});

vi.mock('@astrojs/starlight', () => ({
  default: (options: Record<string, unknown>) => ({ name: 'starlight-test', options }),
}));

describe('publication sidebar configuration', () => {
  it('passes the Canada reading path to Starlight and leaves other sites automatic', () => {
    const canada = createF5xcDocsConfig({ githubRepository: 'f5-sales-demo/canada', federatedSearch: false });
    const starlight = canada.integrations?.[0] as unknown as { options: Record<string, unknown> };
    expect(starlight.options.sidebar).toEqual([
      { slug: 'index' },
      expect.objectContaining({ label: 'Design', collapsed: true }),
      expect.objectContaining({ label: 'Deploy', collapsed: true }),
      expect.objectContaining({ label: 'Verify', collapsed: true }),
      expect.objectContaining({ label: 'Operate', collapsed: true }),
    ]);
    const other = createF5xcDocsConfig({ githubRepository: 'f5-sales-demo/other', federatedSearch: false });
    const fallback = other.integrations?.[0] as unknown as { options: Record<string, unknown> };
    expect(fallback.options).not.toHaveProperty('sidebar');
  });
});
