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
import canonicalLlms from './src/utils/canonical-llms.mjs';
import { providerMegaMenu } from './src/utils/canonical-provider.ts';
import { menuLocalizationPolicy } from './src/utils/menu-localization.ts';
import { stagedProviderSections } from './src/utils/provider-sections.ts';
import { publicationSidebar, repositoryPublicationProfile } from './src/utils/publication-profiles.ts';
import { resolveMegaMenuIcon } from './src/utils/resolve-icon.ts';
import { federatedSearchSites } from './src/utils/search-sites';
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

export const defaultMegaMenuItems: MegaMenuItem[] = [
  {
    label: 'Demos',
    content: {
      layout: 'grid',
      columns: 2,
      categories: [
        {
          title: 'Security',
          items: [
            {
              label: 'Web App & API Protection',
              description: 'Deploy an application security demo with Terraform and follow its protection walkthroughs.',
              href: 'https://f5-sales-demo.github.io/webapp-api-protection/en/',
              icon: resolveMegaMenuIcon('f5xc:web-app-and-api-protection'),
            },
            {
              label: 'API Protection',
              description: 'Find guides to API discovery, schema validation, and request controls.',
              href: 'https://f5-sales-demo.github.io/api-protection/en/',
              icon: resolveMegaMenuIcon('f5xc:application-traffic-insight'),
            },
            {
              label: 'Bot Defense Advanced',
              description: 'Review behavioral bot detection and mitigation scenarios.',
              href: 'https://f5-sales-demo.github.io/bot-advanced/en/',
              icon: resolveMegaMenuIcon('f5xc:bot-defense'),
            },
            {
              label: 'Bot Defense Standard',
              description: 'Review bot classification, verified crawlers, and blocking policies.',
              href: 'https://f5-sales-demo.github.io/bot-standard/en/',
              icon: resolveMegaMenuIcon('f5xc:bot-defense'),
            },
            {
              label: 'Client-Side Defense',
              description: 'Deploy browser script monitoring with an API or Terraform workflow.',
              href: 'https://f5-sales-demo.github.io/csd/en/',
              icon: resolveMegaMenuIcon('f5xc:client-side-defense'),
            },
            {
              label: 'DDoS Mitigation',
              description: 'Review distributed denial-of-service defenses and demo scenarios.',
              href: 'https://f5-sales-demo.github.io/ddos/en/',
              icon: resolveMegaMenuIcon('f5xc:ddos-and-transit-services'),
            },
            {
              label: 'Web App Scanning',
              description: 'Find web application vulnerability scanning guides.',
              href: 'https://f5-sales-demo.github.io/was/en/',
              icon: resolveMegaMenuIcon('f5xc:web-app-scanning'),
            },
            {
              label: 'Custom responses',
              description: 'Configure application replies, redirects, and security response pages.',
              href: 'https://f5-sales-demo.github.io/custom-responses/en/',
              icon: resolveMegaMenuIcon('f5xc:web-app-and-api-protection'),
            },
          ],
        },
        {
          title: 'Networking and performance',
          items: [
            {
              label: 'Multi-Cloud Networking',
              description: 'Find site deployment and cross-cloud connectivity guides.',
              href: 'https://f5-sales-demo.github.io/multi-cloud-networking/en/',
              icon: resolveMegaMenuIcon('f5xc:multi-cloud-network-connect'),
            },
            {
              label: 'Canada topology',
              description: 'Deploy Canadian application hosting and demonstrate regional access controls.',
              href: 'https://f5-sales-demo.github.io/canada/en/',
              icon: {
                body: fs
                  .readFileSync(new URL('./assets/canada-flag.svg', import.meta.url), 'utf8')
                  .replace(/<svg[^>]*>|<\/svg>/g, ''),
                width: 640,
                height: 480,
                mode: 'original',
              },
            },
            {
              label: 'Content Delivery Network',
              description: 'Review content delivery network (CDN) caching and origin configuration.',
              href: 'https://f5-sales-demo.github.io/cdn/en/',
              icon: resolveMegaMenuIcon('f5xc:content-delivery-network'),
            },
            {
              label: 'DNS Management',
              description: 'Find Domain Name System (DNS) zone and load balancing guides.',
              href: 'https://f5-sales-demo.github.io/dns/en/',
              icon: resolveMegaMenuIcon('f5xc:dns-management'),
            },
            {
              label: 'NGINX One',
              description: 'Review NGINX instance visibility and configuration management.',
              href: 'https://f5-sales-demo.github.io/nginx/en/',
              icon: resolveMegaMenuIcon('f5xc:nginx-one'),
            },
          ],
        },
      ],
      footer: {
        label: 'Demo catalog',
        href: 'https://f5-sales-demo.github.io/en/demos/',
        description: 'All demonstration and capability guides',
      },
    },
  },
  {
    label: 'Demo environment',
    content: {
      layout: 'list',
      categories: [
        {
          title: 'Deployment resources',
          items: [
            {
              label: 'Origin server',
              description: 'Compare the Azure full-origin stack with the separate AWS Juice Shop deployment.',
              href: 'https://f5-sales-demo.github.io/origin-server/en/',
              icon: resolveMegaMenuIcon('f5xc:distributed-apps'),
            },
            {
              label: 'Traffic generator',
              description:
                'Choose Azure or AWS deployment guides for controlled security traffic and browser scenarios.',
              href: 'https://f5-sales-demo.github.io/traffic-generator/en/',
              icon: resolveMegaMenuIcon('f5xc:application-traffic-insight'),
            },
            {
              label: 'CDN simulator',
              description: 'Deploy an Azure proxy that adds CDN headers to origin requests.',
              href: 'https://f5-sales-demo.github.io/cdn-simulator/en/',
              icon: resolveMegaMenuIcon('f5xc:content-delivery-network'),
            },
          ],
        },
      ],
      footer: {
        label: 'Demo resource catalog',
        href: 'https://f5-sales-demo.github.io/demo-resources/en/',
        description: 'Azure and AWS offerings vary by component',
      },
    },
  },
  {
    label: 'Operations',
    content: {
      layout: 'list',
      categories: [
        {
          title: 'Queries and administration',
          items: [
            {
              label: 'Statistics',
              description: 'Query access logs, application metrics, and security telemetry through the API.',
              href: 'https://f5-sales-demo.github.io/statistics/en/',
              icon: resolveMegaMenuIcon('f5xc:doc'),
            },
            {
              label: 'Observability',
              description: 'Find monitoring, metrics, tracing, and alerting guides.',
              href: 'https://f5-sales-demo.github.io/observability/en/',
              icon: resolveMegaMenuIcon('f5xc:observability'),
            },
            {
              label: 'Administration',
              description: 'Find tenant, namespace, and role management guides.',
              href: 'https://f5-sales-demo.github.io/administration/en/',
              icon: resolveMegaMenuIcon('f5xc:administration'),
            },
          ],
        },
      ],
    },
  },
  {
    label: 'Developer tools',
    content: {
      layout: 'grid',
      columns: 2,
      categories: [
        {
          title: 'Tools and automation',
          items: [
            {
              label: 'xcsh',
              description:
                'Install the independent terminal assistant for engineering and F5 Distributed Cloud workflows.',
              href: 'https://f5-sales-demo.github.io/xcsh/en/',
              icon: resolveMegaMenuIcon('carbon:terminal'),
            },
            {
              label: 'Terraform provider',
              description: 'Configure F5 Distributed Cloud resources with Terraform.',
              href: 'https://f5-sales-demo.github.io/terraform-provider-xcsh/',
              icon: resolveMegaMenuIcon('f5xc:doc'),
            },
            {
              label: 'xcsh GitHub Action',
              description: 'Run pinned xcsh manifest operations in GitHub Actions.',
              href: 'https://f5-sales-demo.github.io/xcsh-action/en/',
              icon: resolveMegaMenuIcon('carbon:workflow-automation'),
            },
            {
              label: 'VS Code extension',
              description: 'Author manifests and manage F5 Distributed Cloud resources in Visual Studio Code.',
              href: 'https://f5-sales-demo.github.io/vscode-xcsh/en/',
              icon: resolveMegaMenuIcon('carbon:code'),
            },
            {
              label: 'xcsh Chrome extension',
              description: 'Connect xcsh to the F5 Distributed Cloud console through a local browser bridge.',
              href: 'https://f5-sales-demo.github.io/xcsh-chrome-extension/en/',
              icon: resolveMegaMenuIcon('carbon:application-web'),
            },
            {
              label: 'APT repository',
              description: 'Install signed Debian and Ubuntu packages for xcsh and supporting tools.',
              href: 'https://f5-sales-demo.github.io/apt-repo/en/',
              icon: resolveMegaMenuIcon('f5xc:doc'),
            },
          ],
        },
        {
          title: 'Specifications and plugins',
          items: [
            {
              label: 'API specifications',
              description: 'Find validated OpenAPI specifications and the specification update pipeline.',
              href: 'https://f5-sales-demo.github.io/api-specs/en/',
              icon: resolveMegaMenuIcon('f5xc:data-intelligence'),
            },
            {
              label: 'Enriched API specifications',
              description: 'Browse OpenAPI schemas with additional constraints and examples.',
              href: 'https://f5-sales-demo.github.io/api-specs-enriched/en/',
              icon: resolveMegaMenuIcon('f5xc:data-intelligence'),
            },
            {
              label: 'xcsh marketplace',
              description: 'Find xcsh plugins for documentation, sales, cloud, security, and desktop work.',
              href: 'https://f5-sales-demo.github.io/marketplace/en/',
              icon: resolveMegaMenuIcon('f5xc:ai_assistant_logo'),
            },
            {
              label: 'Marketplace for Claude Code',
              description: 'Find Language Server Protocol integrations and developer tools for Claude Code.',
              href: 'https://f5-sales-demo.github.io/marketplace-claude-code/en/',
              icon: resolveMegaMenuIcon('f5xc:doc'),
            },
            {
              label: 'Console catalog',
              description: 'Browse documented console routes and browser automation workflows.',
              href: 'https://f5-sales-demo.github.io/console/en/',
              icon: resolveMegaMenuIcon('f5xc:ai_assistant_logo'),
            },
          ],
        },
      ],
    },
  },
  {
    label: 'Ecosystem',
    content: {
      layout: 'list',
      categories: [
        {
          title: 'Public projects',
          items: [
            {
              label: 'F5 documentation corpus',
              description: 'Browse curated F5 documentation and its Markdown sources.',
              href: 'https://f5-sales-demo.github.io/html-to-markdown/',
              icon: resolveMegaMenuIcon('f5xc:doc'),
            },
            {
              label: 'Ecosystem directory',
              description: 'Documentation, tools, and public project sources',
              href: 'https://f5-sales-demo.github.io/en/ecosystem/',
              icon: resolveMegaMenuIcon('f5xc:doc'),
            },
          ],
        },
      ],
      footer: {
        label: 'Project sources',
        href: 'https://github.com/f5-sales-demo',
        description: 'Public repositories in the community organization',
      },
    },
  },
  {
    label: 'F5 services',
    content: {
      layout: 'list',
      categories: [
        {
          title: 'Official documentation and services',
          items: [
            {
              label: 'F5 Distributed Cloud console',
              description: 'Management service; sign-in required',
              href: 'https://console.ves.volterra.io',
              icon: resolveMegaMenuIcon('f5xc:platform'),
            },
            {
              label: 'F5 Distributed Cloud documentation',
              description: 'Official public product documentation',
              href: 'https://docs.cloud.f5.com',
              icon: resolveMegaMenuIcon('f5xc:doc'),
            },
            {
              label: 'MyF5 support',
              description: 'Support portal; sign-in required for account services',
              href: 'https://my.f5.com/manage/s/',
              icon: resolveMegaMenuIcon('f5xc:support'),
            },
          ],
        },
      ],
    },
  },
];

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
  const megaMenuItems =
    options.megaMenuItems ||
    (canonicalProvider
      ? [...defaultMegaMenuItems, ...providerMegaMenu(base, stagedProviderSections(canonicalProvider.manifest))]
      : defaultMegaMenuItems);
  const head =
    options.head ||
    (canonicalProvider || githubRepository === 'f5-sales-demo/f5-sales-demo.github.io' ? [] : defaultHead);
  const logo = options.logo || { src: '@f5-sales-demo/docs-theme/assets/f5-distributed-cloud.svg' };
  const additionalRemarkPlugins = options.additionalRemarkPlugins || [];
  const additionalIntegrations = options.additionalIntegrations || [];

  const federatedSearch = !canonicalProvider && options.federatedSearch !== false;
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
    starlightMegaMenu({ items: megaMenuItems, mobileLabels }),
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
    vite: { plugins: [menuLocalizationPolicy()], ...(canonicalProvider ? { build: { assetsInlineLimit: 0 } } : {}) },
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
