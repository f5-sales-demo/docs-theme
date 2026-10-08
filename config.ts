import fs from 'node:fs';
import path from 'node:path';
import { unified } from '@astrojs/markdown-remark';
import react from '@astrojs/react';
import starlight from '@astrojs/starlight';
import type { StarlightPlugin } from '@astrojs/starlight/types';
import { BCP47_TO_SLUG } from '@f5-sales-demo/i18n-core';
import starlightLlmsTxt from '@f5-sales-demo/starlight-llms-txt';
import type { MegaMenuItem } from '@f5-sales-demo/starlight-mega-menu';
import starlightMegaMenu from '@f5-sales-demo/starlight-mega-menu';
import type { AstroIntegration } from 'astro';
import { defineConfig } from 'astro/config';
import codeImport from 'remark-code-import';
import starlightHeadingBadges from 'starlight-heading-badges';
import starlightImageZoom from 'starlight-image-zoom';
import starlightOpenAPI, { openAPISidebarGroups } from 'starlight-openapi';
import starlightPageActions from 'starlight-page-actions';
import { starlightIconsPlugin } from 'starlight-plugin-icons';
import starlightScrollToTop from 'starlight-scroll-to-top';
import starlightVideosPlugin from 'starlight-videos';
import f5xcDocsTheme from './index.ts';
import { defaultLocale as f5xcDefaultLocale, f5xcDefaultLocales } from './src/i18n/locales.ts';
import { mobileLabels } from './src/i18n/mega-menu-translations.ts';
import { sidebarTranslations } from './src/i18n/translations.ts';
import remarkMermaid from './src/plugins/remark-mermaid.mjs';
import { sharedSearchIntegration } from './src/shared/search-integration.mjs';
import { sharedMode } from './src/shared/settings.mjs';
import canonicalLlms from './src/utils/canonical-llms.mjs';
import { menuLocalizationPolicy } from './src/utils/menu-localization.ts';
import { publicationSidebar, repositoryPublicationProfile } from './src/utils/publication-profiles.ts';
import { localSearchSites as federatedSearchSites } from './src/utils/search-sites';
import providerSharedAssets from './src/utils/share-provider-assets.mjs';
import { statisticsScriptMarkdown } from './src/utils/statistics-script-markdown.mjs';
import { buildSubcategorySidebar } from './src/utils/subcategory-sidebar.ts';

export type { LocaleConfig } from './src/i18n/locales.ts';
export { f5xcDefaultLocales } from './src/i18n/locales.ts';

interface ProgressiveCorpusPolicy {
  taxonomy?: {
    levels: ['category', 'subcategory'];
    collapseSingletonSubcategories: boolean;
  };
  hints?: {
    strategy: 'first-sentence';
    maxCharacters: number;
  };
}

export function progressiveCorpusPolicy(config: Record<string, unknown>): ProgressiveCorpusPolicy {
  const value = config.progressiveCorpus;
  if (value === undefined) return {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('[docs-theme] progressiveCorpus configuration must be an object');
  }
  const input = value as Record<string, unknown>;
  const policy: ProgressiveCorpusPolicy = {};
  if (input.taxonomy !== undefined) {
    if (!input.taxonomy || typeof input.taxonomy !== 'object' || Array.isArray(input.taxonomy)) {
      throw new Error('[docs-theme] progressiveCorpus taxonomy is invalid');
    }
    const taxonomy = input.taxonomy as Record<string, unknown>;
    const levels = taxonomy.levels;
    if (
      !Array.isArray(levels) ||
      levels.length !== 2 ||
      levels[0] !== 'category' ||
      levels[1] !== 'subcategory' ||
      typeof taxonomy.collapseSingletonSubcategories !== 'boolean'
    ) {
      throw new Error('[docs-theme] progressiveCorpus taxonomy is invalid');
    }
    policy.taxonomy = {
      levels: ['category', 'subcategory'],
      collapseSingletonSubcategories: taxonomy.collapseSingletonSubcategories,
    };
  }
  if (input.hints !== undefined) {
    if (!input.hints || typeof input.hints !== 'object' || Array.isArray(input.hints)) {
      throw new Error('[docs-theme] progressiveCorpus hints are invalid');
    }
    const hints = input.hints as Record<string, unknown>;
    if (
      hints.strategy !== 'first-sentence' ||
      !Number.isInteger(hints.maxCharacters) ||
      (hints.maxCharacters as number) < 1
    ) {
      throw new Error('[docs-theme] progressiveCorpus hints are invalid');
    }
    policy.hints = { strategy: 'first-sentence', maxCharacters: hints.maxCharacters as number };
  }
  return policy;
}

interface HeadEntry {
  tag: string;
  attrs?: Record<string, string>;
  content?: string;
}

export interface F5xcDocsConfigOptions {
  canonicalProvider?: { contentRoot: string; manifest: string; navigation: string; version: string };
  site?: string;
  base?: string;
  title?: string;
  description?: string;
  githubRepository?: string;
  llmsOptionalLinks?: Array<{ title: string; url: string }>;
  additionalIntegrations?: AstroIntegration[];
  additionalRemarkPlugins?: Array<unknown>;
  megaMenuItems?: MegaMenuItem[];
  head?: HeadEntry[];
  favicon?: string;
  logo?: { src: string } | { light: string; dark: string };
  federatedSearch?: boolean;
  locales?: Record<string, { label: string; lang: string; dir?: 'rtl' }> | false;
  defaultLocale?: string;
  progressiveCorpus?: {
    manifest: string;
    contentRoot: string;
    assetBaseUrl?: string;
    title?: string;
    description?: string;
    sources?: Record<string, { title?: string; description?: string }>;
  };
}

export const defaultMegaMenuItems: MegaMenuItem[] = [];
const defaultHead: HeadEntry[] = [
  {
    tag: 'script',
    attrs: { type: 'module' },
    content: `
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

mermaid.registerIconPacks([
  { name: 'hashicorp-flight', loader: () => fetch('https://cdn.jsdelivr.net/npm/@f5-sales-demo/icons-hashicorp-flight/icons.json').then(r => r.json()) },
  { name: 'f5-brand', loader: () => fetch('https://cdn.jsdelivr.net/npm/@f5-sales-demo/icons-f5-brand/icons.json').then(r => r.json()) },
  { name: 'f5xc', loader: () => fetch('https://cdn.jsdelivr.net/npm/@f5-sales-demo/icons-f5xc/icons.json').then(r => r.json()) },
  { name: 'carbon', loader: () => fetch('https://cdn.jsdelivr.net/npm/@f5-sales-demo/icons-carbon/icons.json').then(r => r.json()) },
  { name: 'lucide', loader: () => fetch('https://cdn.jsdelivr.net/npm/@f5-sales-demo/icons-lucide/icons.json').then(r => r.json()) },
  { name: 'mdi', loader: () => fetch('https://cdn.jsdelivr.net/npm/@f5-sales-demo/icons-mdi/icons.json').then(r => r.json()) },
  { name: 'phosphor', loader: () => fetch('https://cdn.jsdelivr.net/npm/@f5-sales-demo/icons-phosphor/icons.json').then(r => r.json()) },
  { name: 'tabler', loader: () => fetch('https://cdn.jsdelivr.net/npm/@f5-sales-demo/icons-tabler/icons.json').then(r => r.json()) },
  { name: 'azure', loader: () => fetch('https://cdn.jsdelivr.net/npm/@f5-sales-demo/icons-azure/icons.json').then(r => r.json()) },
]);

mermaid.initialize({
  startOnLoad: true,
  theme: 'base',
  themeVariables: {
    primaryColor: '#e8ecf4',
    primaryTextColor: '#1a1a2e',
    primaryBorderColor: '#0e41aa',
    lineColor: '#0e41aa',
    secondaryColor: '#fff5eb',
    secondaryTextColor: '#1a1a2e',
    secondaryBorderColor: '#f29a36',
    tertiaryColor: '#f0e6f6',
    tertiaryTextColor: '#1a1a2e',
    tertiaryBorderColor: '#62228b',
    noteBkgColor: '#ffe4c4',
    noteTextColor: '#1a1a2e',
    noteBorderColor: '#f29a36',
    fontFamily: 'F5, system-ui, sans-serif',
  },
});
`,
  },
];

export function federatedSearchBundlePaths(site: string, base: string): string[] {
  const normalizedBase = base.replace(/\/+$/, '');
  return federatedSearchSites
    .filter((entry) => (entry.repo === 'f5-sales-demo.github.io' ? '' : `/${entry.repo}`) !== normalizedBase)
    .map((entry) =>
      entry.repo === 'f5-sales-demo.github.io' ? `${site}/pagefind/` : `${site}/${entry.repo}/pagefind/`,
    );
}

export { federatedSearchSites } from './src/utils/search-sites';

export function createF5xcDocsConfig(options: F5xcDocsConfigOptions = {}) {
  const canonicalProvider =
    options.canonicalProvider ||
    (process.env.DOCS_PROFILE === 'canonical-provider'
      ? {
          contentRoot: process.env.CONTENT_DIR || 'src/content/docs',
          manifest: process.env.CANONICAL_MANIFEST || '',
          navigation: process.env.PROVIDER_NAVIGATION || '',
          version: process.env.DOCUMENTATION_LABEL || 'Latest stable',
        }
      : undefined);
  if (canonicalProvider && (!canonicalProvider.manifest || !canonicalProvider.navigation)) {
    throw new Error('[docs-theme] canonical-provider requires manifest and navigation');
  }
  const site = options.site || process.env.DOCS_SITE || 'https://f5-sales-demo.github.io';
  const base = options.base || process.env.DOCS_BASE || '/';
  const title = options.title || process.env.DOCS_TITLE || (canonicalProvider ? 'Terraform Provider' : 'Documentation');
  const description = options.description || process.env.DOCS_DESCRIPTION || '';
  const githubRepository = options.githubRepository || process.env.GITHUB_REPOSITORY || '';
  const publicationProfile = repositoryPublicationProfile(githubRepository);
  const favicon = options.favicon || publicationProfile?.favicon;
  if (options.favicon) process.env.DOCS_CUSTOM_FAVICON = options.favicon;
  let llmsOptionalLinks: Array<{ title: string; url: string }> = options.llmsOptionalLinks || [];
  if (!options.llmsOptionalLinks && process.env.LLMS_OPTIONAL_LINKS) {
    try {
      llmsOptionalLinks = JSON.parse(process.env.LLMS_OPTIONAL_LINKS);
    } catch (e) {
      console.warn('[docs-theme] LLMS_OPTIONAL_LINKS contains invalid JSON; using defaults.', e);
    }
  }
  let llmsConfig: Record<string, unknown> = {};
  if (process.env.LLMS_CONFIG) {
    try {
      llmsConfig = JSON.parse(process.env.LLMS_CONFIG);
    } catch (e) {
      console.warn('[docs-theme] LLMS_CONFIG contains invalid JSON; using defaults.', e);
    }
  }
  let llmsFederatedSites: unknown[] = [];
  if (process.env.LLMS_FEDERATED_SITES) {
    try {
      llmsFederatedSites = JSON.parse(process.env.LLMS_FEDERATED_SITES);
    } catch (e) {
      console.warn('[docs-theme] LLMS_FEDERATED_SITES contains invalid JSON; using defaults.', e);
    }
  }
  let llmsFederatedSiteCategories: unknown[] = [];
  if (process.env.LLMS_FEDERATED_SITE_CATEGORIES) {
    try {
      llmsFederatedSiteCategories = JSON.parse(process.env.LLMS_FEDERATED_SITE_CATEGORIES);
    } catch (e) {
      console.warn('[docs-theme] LLMS_FEDERATED_SITE_CATEGORIES contains invalid JSON; using defaults.', e);
    }
  }
  let openAPISpecs: Array<{ base: string; schema: string; sidebar?: { label?: string; collapsed?: boolean } }> = [];
  if (process.env.OPENAPI_SPECS_CONFIG) {
    try {
      openAPISpecs = JSON.parse(process.env.OPENAPI_SPECS_CONFIG);
    } catch (e) {
      console.warn('[docs-theme] OPENAPI_SPECS_CONFIG contains invalid JSON; skipping OpenAPI plugin.', e);
    }
  }
  const mode = sharedMode(githubRepository);
  const megaMenuItems = options.megaMenuItems || defaultMegaMenuItems;
  const head =
    options.head ||
    (canonicalProvider || githubRepository === 'f5-sales-demo/f5-sales-demo.github.io' ? [] : defaultHead);
  const logo =
    options.logo ||
    (mode === 'local' ? { src: '@f5-sales-demo/docs-theme/assets/f5-distributed-cloud.svg' } : undefined);
  const additionalRemarkPlugins = options.additionalRemarkPlugins || [];
  const additionalIntegrations = options.additionalIntegrations || [];

  const federatedSearch = mode === 'local' && !canonicalProvider && options.federatedSearch !== false;
  const normalizedBase = base.replace(/\/+$/, '');
  const repositoryCorpusPolicy = progressiveCorpusPolicy(llmsConfig);
  const progressiveCorpus =
    options.progressiveCorpus ||
    (process.env.MACHINE_CORPUS_DIR
      ? {
          manifest: path.join(process.env.MACHINE_CORPUS_DIR, 'manifest.json'),
          contentRoot: process.env.MACHINE_CORPUS_DIR,
          assetBaseUrl: `${normalizedBase}/snapshot/`,
          title,
          description,
          ...repositoryCorpusPolicy,
          sources: {
            'docs-cloud-f5-com': {
              title: 'F5 Distributed Cloud Documentation',
              description: 'Official F5 Distributed Cloud product documentation.',
            },
            'my-f5-com': {
              title: 'MyF5 Knowledge',
              description: 'F5 support and knowledge articles.',
            },
          },
        }
      : undefined);
  const mergeIndex = federatedSearch
    ? federatedSearchBundlePaths(site, base).map((bundlePath) => ({ bundlePath }))
    : undefined;

  const starlightPlugins: StarlightPlugin[] = [
    ...(mode === 'local' ? [starlightMegaMenu({ items: megaMenuItems, mobileLabels })] : []),
    starlightVideosPlugin(),
    starlightImageZoom(),
    f5xcDocsTheme(githubRepository),
    starlightScrollToTop({
      showTooltip: true,
      tooltipText: {
        en: 'Scroll to top',
        fr: 'Retour en haut',
        es: 'Volver arriba',
        de: 'Nach oben',
        'pt-BR': 'Voltar ao topo',
        ja: 'トップに戻る',
        ko: '맨 위로',
        'zh-CN': '回到顶部',
        'zh-TW': '回到頂部',
        ar: 'العودة للأعلى',
        it: 'Torna su',
        hi: 'शीर्ष पर जाएँ',
        th: 'กลับไปด้านบน',
      },
      smoothScroll: true,
      threshold: 10,
      showProgressRing: true,
      progressRingColor: '#e4002b',
      showOnHomepage: false,
    }),
    ...(!canonicalProvider ? [starlightHeadingBadges(), starlightPageActions()] : []),
    starlightIconsPlugin(),
    ...(openAPISpecs.length > 0
      ? [
          starlightOpenAPI(
            openAPISpecs.map((spec) => ({
              base: spec.base,
              schema: spec.schema,
              sidebar: {
                collapsed: spec.sidebar?.collapsed ?? true,
                label: spec.sidebar?.label,
              },
            })),
          ),
        ]
      : []),
    ...(!canonicalProvider
      ? [
          starlightLlmsTxt({
            projectName: title,
            description,
            rawContent: false,
            optionalLinks: llmsOptionalLinks,
            sidebarNav: true,
            tieredHierarchy: true,
            promote: llmsConfig.promote || ['index*', 'overview*'],
            demote: llmsConfig.demote || ['references*'],
            ...(llmsConfig.exclude ? { exclude: llmsConfig.exclude } : {}),
            ...(llmsFederatedSites.length > 0 ? { federatedSites: llmsFederatedSites } : {}),
            ...(llmsFederatedSiteCategories.length > 0 ? { federatedSiteCategories: llmsFederatedSiteCategories } : {}),
            ...(progressiveCorpus ? { progressiveCorpus } : {}),
          }),
        ]
      : []),
  ];

  const contentDir = process.env.CONTENT_DIR || 'src/content/docs';
  const subcategorySidebar = canonicalProvider
    ? []
    : publicationSidebar(githubRepository, buildSubcategorySidebar(contentDir));

  // Auto-detect i18n: enable locales only when content has an en/ subdirectory.
  // Repos that haven't migrated to docs/en/ won't get a broken language selector.
  const hasEnSubdir = fs.existsSync(path.resolve(contentDir, 'en'));
  const resolvedLocales =
    canonicalProvider || options.locales === false
      ? undefined
      : options.locales || publicationProfile?.locales || (hasEnSubdir ? f5xcDefaultLocales : undefined);
  const resolvedDefaultLocale = options.defaultLocale || publicationProfile?.defaultLocale || f5xcDefaultLocale;

  const localeHeadScripts: HeadEntry[] = [];
  if (resolvedLocales) {
    const langToSlugMap = BCP47_TO_SLUG;
    const slugSet = JSON.stringify(Object.keys(resolvedLocales));

    localeHeadScripts.push({
      tag: 'script',
      content: `
(function(){
  try {
    var stored = localStorage.getItem('f5xc-locale');
    if (!stored || stored === '${resolvedDefaultLocale}') return;
    if (sessionStorage.getItem('f5xc-locale-redirected')) return;
    var valid = new Set(${slugSet});
    if (!valid.has(stored)) return;
    var base = '${normalizedBase}';
    var path = window.location.pathname;
    var afterBase = path.slice(base.length).replace(/^\\/+/, '').replace(/\\/+$/, '');
    var segments = afterBase ? afterBase.split('/') : [];
    if (segments.length > 1) return;
    if (segments[0] === '${resolvedDefaultLocale}') {
      sessionStorage.setItem('f5xc-locale-redirected', '1');
      window.location.replace(base + '/' + stored + '/');
    }
  } catch(e) {}
})();
`,
    });

    localeHeadScripts.push({
      tag: 'script',
      content: `
(function(){
  try {
    var m = ${JSON.stringify(langToSlugMap)};
    var lang = document.documentElement.lang || 'en';
    var slug = m[lang] || lang.toLowerCase();
    localStorage.setItem('f5xc-locale', slug);
  } catch(e) {}
})();
`,
    });
  }

  return defineConfig({
    site,
    base,
    vite: {
      plugins: mode === 'local' ? [menuLocalizationPolicy()] : [sharedSearchIntegration()],
      ...(canonicalProvider ? { build: { assetsInlineLimit: 0 } } : {}),
    },
    ...(canonicalProvider
      ? {
          experimental: { collectionStorage: { type: 'chunked' as const, chunkSize: 1024 * 1024 } },
        }
      : {}),
    ...(canonicalProvider
      ? { redirects: { '/en/': `${normalizedBase}/` } }
      : resolvedLocales
        ? { redirects: { '/': `${normalizedBase}/${resolvedDefaultLocale}/` } }
        : {}),
    markdown: {
      processor: unified({
        remarkPlugins: [remarkMermaid, [codeImport, { allowImportingFromOutside: true }], ...additionalRemarkPlugins],
      }),
    },
    integrations: [
      starlight({
        title,
        plugins: starlightPlugins,
        head: [...((head as Parameters<typeof starlight>[0]['head']) || []), ...localeHeadScripts] as Parameters<
          typeof starlight
        >[0]['head'],
        ...(favicon ? { favicon } : {}),
        logo: logo as Parameters<typeof starlight>[0]['logo'],
        ...(resolvedLocales ? { locales: resolvedLocales, defaultLocale: resolvedDefaultLocale } : {}),
        ...(subcategorySidebar
          ? { sidebar: [...subcategorySidebar, ...(openAPISpecs.length > 0 ? openAPISidebarGroups : [])] }
          : openAPISpecs.length > 0
            ? {
                sidebar: [
                  {
                    label: 'API Reference',
                    translations: sidebarTranslations['API Reference'],
                    items: [
                      { label: 'Overview', translations: sidebarTranslations.Overview, slug: 'api-reference' },
                      ...openAPISidebarGroups,
                    ],
                  },
                ],
              }
            : {}),
        ...(mergeIndex && mergeIndex.length > 0 ? { pagefind: { mergeIndex } } : {}),
        ...(githubRepository
          ? {
              editLink: {
                baseUrl: `https://github.com/${githubRepository}/edit/main/`,
              },
            }
          : {}),
        social: [
          {
            label: 'GitHub',
            icon: 'github',
            href: `https://github.com/${githubRepository}`,
          },
        ],
      }),
      react(),
      ...(canonicalProvider
        ? [providerSharedAssets(), canonicalLlms({ contentRoot: canonicalProvider.contentRoot, base, title })]
        : []),
      ...(githubRepository === 'f5-sales-demo/statistics' ? [statisticsScriptMarkdown()] : []),
      ...additionalIntegrations,
    ],
  });
}
