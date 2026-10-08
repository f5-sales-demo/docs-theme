import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  createF5xcDocsConfig,
  defaultMegaMenuItems,
  federatedSearchBundlePaths,
  federatedSearchSites,
  progressiveCorpusPolicy,
} from './config';
import packageJson from './package.json';

describe('default ecosystem navigation', () => {
  it('groups developer tools once and registers the Action for federated search', () => {
    const tools = defaultMegaMenuItems.find((item) => item.label === 'Developer tools');
    const items = tools?.content?.categories?.flatMap((category) => category.items) ?? [];
    expect(items.filter((item) => item.label === 'xcsh')).toHaveLength(1);
    expect(items.find((item) => item.label === 'xcsh GitHub Action')?.href).toBe(
      'https://f5-sales-demo.github.io/xcsh-action/en/',
    );
    expect(federatedSearchSites).toContainEqual({ repo: 'xcsh-action', label: 'xcsh GitHub Action' });
  });

  it('uses one canonical Web App & API Protection identity', () => {
    const security = defaultMegaMenuItems.find((item) => item.label === 'Demos');
    const items = security?.content?.categories?.flatMap((category) => category.items) ?? [];
    expect(items.filter((item) => item.label === 'Web App & API Protection')).toEqual([
      expect.objectContaining({
        href: 'https://f5-sales-demo.github.io/webapp-api-protection/en/',
        description: 'Deploy an application security demo with Terraform and follow its protection walkthroughs.',
      }),
    ]);
    expect(items.filter((item) => item.label === 'API Protection')).toHaveLength(1);
    expect(JSON.stringify(defaultMegaMenuItems)).not.toContain('https://f5-sales-demo.github.io/waf/');
    expect(federatedSearchSites.filter((site) => site.repo === 'webapp-api-protection')).toEqual([
      { repo: 'webapp-api-protection', label: 'Web App & API Protection' },
    ]);
    expect(federatedSearchSites.some((site) => site.repo === 'waf')).toBe(false);
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

  it('links the corpus without federating its non-HTML routes', () => {
    const ecosystem = defaultMegaMenuItems.find((item) => item.label === 'Ecosystem');
    const corpus = ecosystem?.content?.categories
      ?.flatMap((category) => category.items)
      .find((item) => item.label === 'F5 documentation corpus');
    expect(corpus?.href).toBe('https://f5-sales-demo.github.io/html-to-markdown/');
    expect(federatedSearchSites.some((site) => site.repo === 'html-to-markdown')).toBe(false);
  });

  it('omits the unmaintained mvp Pages site from active discovery', () => {
    expect(JSON.stringify(defaultMegaMenuItems)).not.toContain('https://f5-sales-demo.github.io/mvp/');
    expect(federatedSearchSites.some((site) => site.repo === 'mvp')).toBe(false);
  });

  it('omits the archived Dev Container from active menu and search', () => {
    expect(JSON.stringify(defaultMegaMenuItems)).not.toContain('https://f5-sales-demo.github.io/devcontainer/');
    expect(federatedSearchSites.some((site) => site.repo === 'devcontainer')).toBe(false);
  });

  it('links the portal at the organization root and merges its search only from other sites', () => {
    const links = defaultMegaMenuItems.flatMap((item) => item.content?.categories?.flatMap((c) => c.items) ?? []);
    expect(links.some((link) => link.href === 'https://f5-sales-demo.github.io/')).toBe(false);
    expect(federatedSearchSites).toContainEqual({ repo: 'f5-sales-demo.github.io', label: 'Sales demo portal' });
    const childBundles = federatedSearchBundlePaths('https://f5-sales-demo.github.io', '/webapp-api-protection');
    expect(childBundles).toContain('https://f5-sales-demo.github.io/pagefind/');
    const rootBundles = federatedSearchBundlePaths('https://f5-sales-demo.github.io', '/');
    expect(rootBundles).not.toContain('https://f5-sales-demo.github.io/pagefind/');
  });

  it('pins the progressive corpus plugin release exactly', () => {
    expect(packageJson.dependencies['@f5-sales-demo/starlight-llms-txt']).toBe('2.3.1');
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

describe('Canada navigation and publication wiring', () => {
  it('places the original-color flag immediately after MCN and federates search', () => {
    const items =
      defaultMegaMenuItems
        .find((item) => item.label === 'Demos')
        ?.content?.categories?.find((category) => category.title === 'Networking and performance')?.items || [];
    const index = items.findIndex((item) => item.label === 'Multi-Cloud Networking');
    const canada = items[index + 1];
    expect(canada.label).toBe('Canada topology');
    expect(canada.description).toBe('Deploy Canadian application hosting and demonstrate regional access controls.');
    expect(canada.href).toBe('https://f5-sales-demo.github.io/canada/en/');
    expect(canada.icon).toMatchObject({ width: 640, height: 480, mode: 'original' });
    expect(JSON.stringify(canada.icon)).toContain('#d52b1e');
    expect(JSON.stringify(canada.icon)).toContain('#fff');
    expect(federatedSearchSites).toContainEqual({ repo: 'canada', label: 'Canada topology' });
  });
});

describe('custom response showcase navigation', () => {
  it('links the exact owned documentation site', () => {
    expect(JSON.stringify(defaultMegaMenuItems)).toContain('https://f5-sales-demo.github.io/custom-responses/');
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
