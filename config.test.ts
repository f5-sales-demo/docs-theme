import { describe, expect, it } from 'vitest';
import {
  defaultMegaMenuItems,
  federatedSearchBundlePaths,
  federatedSearchSites,
  progressiveCorpusPolicy,
} from './config';
import packageJson from './package.json';
import { f5xcDefaultLocales } from './src/i18n/locales';

describe('default ecosystem navigation', () => {
  it('consolidates developer automation under Platform', () => {
    expect(defaultMegaMenuItems.map((item) => item.label)).not.toContain('Tools');

    const platform = defaultMegaMenuItems.find((item) => item.label === 'Platform');
    const developerAutomation = platform?.content?.categories?.find(
      (category) => category.title === 'Developer Automation',
    );

    expect(developerAutomation?.items.map((item) => item.label)).toEqual([
      'Terraform Provider',
      'API Specs',
      'API Specs Enriched',
      'xcsh Manifest Automation',
      'VS Code Extension',
      'xcsh CLI',
      'xcsh Chrome Extension',
    ]);
    expect(Object.keys(developerAutomation?.translations ?? {})).toHaveLength(
      Object.keys(f5xcDefaultLocales).length - 1,
    );
  });

  it('keeps the product name stable and localizes its description', () => {
    const platform = defaultMegaMenuItems.find((item) => item.label === 'Platform');
    const action = platform?.content?.categories
      ?.flatMap((category) => category.items)
      .find((item) => item.label === 'xcsh Manifest Automation');

    expect(action?.href).toBe('https://f5-sales-demo.github.io/xcsh-action/');
    expect(action).not.toHaveProperty('translations');
    expect(Object.keys(action?.descriptionTranslations ?? {})).toHaveLength(Object.keys(f5xcDefaultLocales).length - 1);
  });

  it('retains xcsh under AI and registers the Action for federated search', () => {
    const ai = defaultMegaMenuItems.find((item) => item.label === 'AI');
    expect(ai?.content?.categories?.flatMap((category) => category.items).map((item) => item.label)).toContain('xcsh');
    expect(federatedSearchSites).toContainEqual({ repo: 'xcsh-action', label: 'xcsh Manifest Automation' });
  });

  it('uses only the renamed Multi-Cloud Networking Pages path', () => {
    const serializedMenu = JSON.stringify(defaultMegaMenuItems);

    expect(serializedMenu).toContain('https://f5-sales-demo.github.io/multi-cloud-networking/');
    expect(serializedMenu).not.toContain('https://f5-sales-demo.github.io/mcn/');
    expect(federatedSearchSites).toContainEqual({ repo: 'multi-cloud-networking', label: 'Multi-Cloud Networking' });
    expect(federatedSearchSites.some((site) => site.repo === 'mcn')).toBe(false);
    expect(federatedSearchBundlePaths('https://f5-sales-demo.github.io', '/')).toContain(
      'https://f5-sales-demo.github.io/multi-cloud-networking/pagefind/',
    );
  });

  it('links the localized F5 Docs Corpus without federating its non-HTML routes', () => {
    const platform = defaultMegaMenuItems.find((item) => item.label === 'Platform');
    const documentationTools = platform?.content?.categories?.find(
      (category) => category.title === 'Documentation Tools',
    );
    const corpus = documentationTools?.items.find((item) => item.label === 'F5 Docs Corpus');

    expect(corpus?.href).toBe('https://f5-sales-demo.github.io/html-to-markdown/');
    expect(Object.keys(corpus?.translations ?? {})).toHaveLength(Object.keys(f5xcDefaultLocales).length - 1);
    expect(Object.keys(corpus?.descriptionTranslations ?? {})).toHaveLength(Object.keys(f5xcDefaultLocales).length - 1);
    expect(federatedSearchSites.some((site) => site.repo === 'html-to-markdown')).toBe(false);
  });

  it('links the portal at the organization root and merges its search only from other sites', () => {
    const platform = defaultMegaMenuItems.find((item) => item.label === 'Platform');
    const portal = platform?.content?.categories
      ?.flatMap((category) => category.items)
      .find((item) => item.label === 'F5 XC Docs');
    expect(portal?.href).toBe('https://f5-sales-demo.github.io/');
    expect(federatedSearchSites).toContainEqual({ repo: 'f5-sales-demo.github.io', label: 'F5 XC Docs' });
    const childBundles = federatedSearchBundlePaths('https://f5-sales-demo.github.io', '/waf');
    expect(childBundles).toContain('https://f5-sales-demo.github.io/pagefind/');
    const rootBundles = federatedSearchBundlePaths('https://f5-sales-demo.github.io', '/');
    expect(rootBundles).not.toContain('https://f5-sales-demo.github.io/pagefind/');
  });

  it('pins the progressive corpus plugin release exactly', () => {
    expect(packageJson.dependencies['@f5-sales-demo/starlight-llms-txt']).toBe('2.2.0');
  });
});

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
    const config = createF5xcDocsConfig({
      base: '/terraform-provider-xcsh/versions/v12.0.6/',
      canonicalProvider: {
        contentRoot: '/alternate/documentation',
        manifest: '/alternate/generated-manifest.json',
        navigation: '/temporary/navigation.json',
        version: 'v12.0.6',
      },
    });
    expect(config.experimental?.collectionStorage).toEqual({ type: 'chunked', chunkSize: 1024 * 1024 });
    expect(config.base).toBe('/terraform-provider-xcsh/versions/v12.0.6/');
  });
});
