import fs from 'node:fs';
import path from 'node:path';
import react from '@astrojs/react';
import starlight from '@astrojs/starlight';
import type { StarlightPlugin } from '@astrojs/starlight/types';
import { BCP47_TO_SLUG, SLUG_LIST } from '@f5xc-salesdemos/i18n-core';
import starlightLlmsTxt from '@f5xc-salesdemos/starlight-llms-txt';
import starlightMegaMenu from '@f5xc-salesdemos/starlight-mega-menu';
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
import {
  categoryTitles,
  footerDescriptions,
  footerLabels,
  itemDescriptions,
  itemLabels,
  menuLabels,
  mobileLabels,
} from './src/i18n/mega-menu-translations.ts';
import { sidebarTranslations } from './src/i18n/translations.ts';
import remarkMermaid from './src/plugins/remark-mermaid.mjs';
import { resolveIcon } from './src/utils/resolve-icon.ts';
import { buildSubcategorySidebar } from './src/utils/subcategory-sidebar.ts';

export type { LocaleConfig } from './src/i18n/locales.ts';
export { f5xcDefaultLocales } from './src/i18n/locales.ts';

interface MegaMenuItem {
  label: string;
  translations?: Record<string, string>;
  href?: string;
  content?: {
    layout?: string;
    columns?: number;
    categories?: Array<{
      title: string;
      translations?: Record<string, string>;
      items: Array<{
        label: string;
        translations?: Record<string, string>;
        description?: string;
        descriptionTranslations?: Record<string, string>;
        href: string;
        icon?: string;
      }>;
    }>;
    footer?: {
      label: string;
      translations?: Record<string, string>;
      href: string;
      description?: string;
      descriptionTranslations?: Record<string, string>;
    };
  };
}

interface HeadEntry {
  tag: string;
  attrs?: Record<string, string>;
  content?: string;
}

export interface F5xcDocsConfigOptions {
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
  logo?: { src: string } | { light: string; dark: string };
  federatedSearch?: boolean;
  locales?: Record<string, { label: string; lang: string; dir?: 'rtl' }> | false;
  defaultLocale?: string;
}

const defaultMegaMenuItems: MegaMenuItem[] = [
  {
    label: 'Security',
    translations: menuLabels.Security,
    content: {
      layout: 'grid',
      columns: 2,
      categories: [
        {
          title: 'App & API Security',
          translations: categoryTitles['App & API Security'],
          items: [
            {
              label: 'Web App Firewall',
              translations: itemLabels['Web App Firewall'],
              description: 'Firewall policies and configuration',
              descriptionTranslations: itemDescriptions['Firewall policies and configuration'],
              href: 'https://f5xc-salesdemos.github.io/waf/',
              icon: resolveIcon('f5xc:web-app-and-api-protection'),
            },
            {
              label: 'API Security',
              translations: itemLabels['API Security'],
              description: 'API discovery and protection',
              descriptionTranslations: itemDescriptions['API discovery and protection'],
              href: 'https://f5xc-salesdemos.github.io/api-protection/',
              icon: resolveIcon('f5xc:application-traffic-insight'),
            },
            {
              label: 'Client-Side Defense',
              translations: itemLabels['Client-Side Defense'],
              description: 'Browser-based threat protection',
              descriptionTranslations: itemDescriptions['Browser-based threat protection'],
              href: 'https://f5xc-salesdemos.github.io/csd/',
              icon: resolveIcon('f5xc:client-side-defense'),
            },
            {
              label: 'Web App Scanning',
              translations: itemLabels['Web App Scanning'],
              description: 'Vulnerability assessment and scanning',
              descriptionTranslations: itemDescriptions['Vulnerability assessment and scanning'],
              href: 'https://f5xc-salesdemos.github.io/was/',
              icon: resolveIcon('f5xc:web-app-scanning'),
            },
          ],
        },
        {
          title: 'Threat Defense',
          translations: categoryTitles['Threat Defense'],
          items: [
            {
              label: 'Bot Defense Advanced',
              translations: itemLabels['Bot Defense Advanced'],
              description: 'Behavioral analysis and AI detection',
              descriptionTranslations: itemDescriptions['Behavioral analysis and AI detection'],
              href: 'https://f5xc-salesdemos.github.io/bot-advanced/',
              icon: resolveIcon('f5xc:bot-defense'),
            },
            {
              label: 'Bot Defense Standard',
              translations: itemLabels['Bot Defense Standard'],
              description: 'Signature-based bot detection',
              descriptionTranslations: itemDescriptions['Signature-based bot detection'],
              href: 'https://f5xc-salesdemos.github.io/bot-standard/',
              icon: resolveIcon('f5xc:bot-defense'),
            },
            {
              label: 'DDoS Protection',
              translations: itemLabels['DDoS Protection'],
              description: 'Distributed denial-of-service mitigation',
              descriptionTranslations: itemDescriptions['Distributed denial-of-service mitigation'],
              href: 'https://f5xc-salesdemos.github.io/ddos/',
              icon: resolveIcon('f5xc:ddos-and-transit-services'),
            },
          ],
        },
      ],
      footer: {
        label: 'F5 Distributed Cloud Console',
        translations: footerLabels['F5 Distributed Cloud Console'],
        href: 'https://console.ves.volterra.io',
        description: 'Open the XC management portal',
        descriptionTranslations: footerDescriptions['Open the XC management portal'],
      },
    },
  },
  {
    label: 'Networking',
    translations: menuLabels.Networking,
    content: {
      layout: 'grid',
      columns: 2,
      categories: [
        {
          title: 'Connectivity & Delivery',
          translations: categoryTitles['Connectivity & Delivery'],
          items: [
            {
              label: 'Multi-Cloud Networking',
              translations: itemLabels['Multi-Cloud Networking'],
              description: 'Site connectivity across clouds',
              descriptionTranslations: itemDescriptions['Site connectivity across clouds'],
              href: 'https://f5xc-salesdemos.github.io/mcn/',
              icon: resolveIcon('f5xc:multi-cloud-network-connect'),
            },
            {
              label: 'Content Delivery',
              translations: itemLabels['Content Delivery'],
              description: 'Edge caching and distribution',
              descriptionTranslations: itemDescriptions['Edge caching and distribution'],
              href: 'https://f5xc-salesdemos.github.io/cdn/',
              icon: resolveIcon('f5xc:content-delivery-network'),
            },
            {
              label: 'DNS Load Balancing',
              translations: itemLabels['DNS Load Balancing'],
              description: 'DNS management and zones',
              descriptionTranslations: itemDescriptions['DNS management and zones'],
              href: 'https://f5xc-salesdemos.github.io/dns/',
              icon: resolveIcon('f5xc:dns-management'),
            },
            {
              label: 'NGINX Management',
              translations: itemLabels['NGINX Management'],
              description: 'NGINX integration and configuration',
              descriptionTranslations: itemDescriptions['NGINX integration and configuration'],
              href: 'https://f5xc-salesdemos.github.io/nginx/',
              icon: resolveIcon('f5xc:nginx-one'),
            },
          ],
        },
        {
          title: 'Manage & Monitor',
          translations: categoryTitles['Manage & Monitor'],
          items: [
            {
              label: 'Observability',
              translations: itemLabels.Observability,
              description: 'Monitoring, metrics, and insights',
              descriptionTranslations: itemDescriptions['Monitoring, metrics, and insights'],
              href: 'https://f5xc-salesdemos.github.io/observability/',
              icon: resolveIcon('f5xc:observability'),
            },
            {
              label: 'Administration',
              translations: itemLabels.Administration,
              description: 'Tenant management and RBAC',
              descriptionTranslations: itemDescriptions['Tenant management and RBAC'],
              href: 'https://f5xc-salesdemos.github.io/administration/',
              icon: resolveIcon('f5xc:administration'),
            },
          ],
        },
      ],
      footer: {
        label: 'F5 Cloud Documentation',
        translations: footerLabels['F5 Cloud Documentation'],
        href: 'https://docs.cloud.f5.com',
        description: 'Official product documentation',
        descriptionTranslations: footerDescriptions['Official product documentation'],
      },
    },
  },
  {
    label: 'Platform',
    translations: menuLabels.Platform,
    content: {
      layout: 'list',
      categories: [
        {
          title: 'Documentation Tools',
          translations: categoryTitles['Documentation Tools'],
          items: [
            {
              label: 'Docs Builder',
              translations: itemLabels['Docs Builder'],
              description: 'Containerized Astro build system',
              descriptionTranslations: itemDescriptions['Containerized Astro build system'],
              href: 'https://f5xc-salesdemos.github.io/docs-builder/',
              icon: resolveIcon('f5xc:doc'),
            },
            {
              label: 'Docs Theme',
              translations: itemLabels['Docs Theme'],
              description: 'Shared branding and styling',
              descriptionTranslations: itemDescriptions['Shared branding and styling'],
              href: 'https://f5xc-salesdemos.github.io/docs-theme/',
              icon: resolveIcon('f5xc:shared-configuration'),
            },
            {
              label: 'Icon Packages',
              translations: itemLabels['Icon Packages'],
              description: 'NPM icon component library',
              descriptionTranslations: itemDescriptions['NPM icon component library'],
              href: 'https://f5xc-salesdemos.github.io/docs-icons/',
              icon: resolveIcon('f5xc:distributed-apps'),
            },
            {
              label: 'Dev Container',
              translations: itemLabels['Dev Container'],
              description: 'Isolated development environment',
              descriptionTranslations: itemDescriptions['Isolated development environment'],
              href: 'https://f5xc-salesdemos.github.io/devcontainer/',
              icon: resolveIcon('hashicorp-flight:docker-color'),
            },
            {
              label: 'mvp',
              translations: itemLabels.mvp,
              description:
                'Capability program that amplifies F5 Distributed Cloud practitioners with an agentic subject matter expert',
              descriptionTranslations:
                itemDescriptions[
                  'Capability program that amplifies F5 Distributed Cloud practitioners with an agentic subject matter expert'
                ],
              href: 'https://f5xc-salesdemos.github.io/mvp/',
              icon: resolveIcon('f5xc:ai_assistant_logo'),
            },
          ],
        },
        {
          title: 'Automation',
          translations: categoryTitles.Automation,
          items: [
            {
              label: 'Terraform Provider',
              translations: itemLabels['Terraform Provider'],
              description: 'F5 XC Terraform provider',
              descriptionTranslations: itemDescriptions['F5 XC Terraform provider'],
              href: 'https://f5xc-salesdemos.github.io/terraform-provider-f5xc/',
              icon: resolveIcon('hashicorp-flight:terraform-color'),
            },
            {
              label: 'API Specs',
              translations: itemLabels['API Specs'],
              description: 'OpenAPI spec validation and reconciliation',
              descriptionTranslations: itemDescriptions['OpenAPI spec validation and reconciliation'],
              href: 'https://f5xc-salesdemos.github.io/api-specs/',
              icon: resolveIcon('f5xc:data-intelligence'),
            },
            {
              label: 'API Specs Enriched',
              translations: itemLabels['API Specs Enriched'],
              description: 'Enriched OpenAPI specifications',
              descriptionTranslations: itemDescriptions['Enriched OpenAPI specifications'],
              href: 'https://f5xc-salesdemos.github.io/api-specs-enriched/',
              icon: resolveIcon('f5xc:data-intelligence'),
            },
          ],
        },
      ],
      footer: {
        label: 'GitHub Organization',
        translations: footerLabels['GitHub Organization'],
        href: 'https://github.com/f5xc-salesdemos',
        description: 'View all repositories',
        descriptionTranslations: footerDescriptions['View all repositories'],
      },
    },
  },
  {
    label: 'AI',
    translations: menuLabels.AI,
    content: {
      layout: 'list',
      categories: [
        {
          title: 'AI Tools',
          translations: categoryTitles['AI Tools'],
          items: [
            {
              label: 'Marketplace',
              translations: itemLabels.Marketplace,
              description: 'AI-powered marketplace for F5 XC',
              descriptionTranslations: itemDescriptions['AI-powered marketplace for F5 XC'],
              href: 'https://f5xc-salesdemos.github.io/marketplace/',
              icon: resolveIcon('f5xc:ai_assistant_logo'),
            },
            {
              label: 'xcsh',
              translations: itemLabels.xcsh,
              description: 'AI-powered development CLI with persistent sessions and native Rust tooling',
              descriptionTranslations:
                itemDescriptions['AI-powered development CLI with persistent sessions and native Rust tooling'],
              href: 'https://f5xc-salesdemos.github.io/xcsh/',
              icon: resolveIcon('f5xc:ai_assistant_logo'),
            },
          ],
        },
      ],
    },
  },
  {
    label: 'Demo Resources',
    translations: menuLabels['Demo Resources'],
    content: {
      layout: 'list',
      categories: [
        {
          title: 'Components',
          translations: categoryTitles.Components,
          items: [
            {
              label: 'Origin Server',
              translations: itemLabels['Origin Server'],
              description: 'Vulnerable web applications for WAF and API testing',
              descriptionTranslations: itemDescriptions['Vulnerable web applications for WAF and API testing'],
              href: 'https://f5xc-salesdemos.github.io/origin-server/',
              icon: resolveIcon('f5xc:distributed-apps'),
            },
            {
              label: 'Traffic Generator',
              translations: itemLabels['Traffic Generator'],
              description: 'Security tools and attack suites for traffic generation',
              descriptionTranslations: itemDescriptions['Security tools and attack suites for traffic generation'],
              href: 'https://f5xc-salesdemos.github.io/traffic-generator/',
              icon: resolveIcon('f5xc:application-traffic-insight'),
            },
            {
              label: 'CDN Simulator',
              translations: itemLabels['CDN Simulator'],
              description: 'NGINX-based CDN edge node simulator',
              descriptionTranslations: itemDescriptions['NGINX-based CDN edge node simulator'],
              href: 'https://f5xc-salesdemos.github.io/cdn-simulator/',
              icon: resolveIcon('f5xc:content-delivery-network'),
            },
          ],
        },
      ],
      footer: {
        label: 'View All Components',
        translations: footerLabels['View All Components'],
        href: 'https://f5xc-salesdemos.github.io/demo-resources/',
        description: 'Browse the full demo resource catalog',
        descriptionTranslations: footerDescriptions['Browse the full demo resource catalog'],
      },
    },
  },
  {
    label: 'Resources',
    translations: menuLabels.Resources,
    content: {
      layout: 'list',
      categories: [
        {
          title: 'F5 Ecosystem',
          translations: categoryTitles['F5 Ecosystem'],
          items: [
            {
              label: 'F5 XC Console',
              translations: itemLabels['F5 XC Console'],
              description: 'Distributed Cloud management portal',
              descriptionTranslations: itemDescriptions['Distributed Cloud management portal'],
              href: 'https://console.ves.volterra.io',
              icon: resolveIcon('f5xc:platform'),
            },
            {
              label: 'F5 Cloud Docs',
              translations: itemLabels['F5 Cloud Docs'],
              description: 'Official product documentation',
              descriptionTranslations: itemDescriptions['Official product documentation'],
              href: 'https://docs.cloud.f5.com',
              icon: resolveIcon('f5xc:doc'),
            },
            {
              label: 'MyF5 Support',
              translations: itemLabels['MyF5 Support'],
              description: 'Technical support portal',
              descriptionTranslations: itemDescriptions['Technical support portal'],
              href: 'https://my.f5.com/manage/s/',
              icon: resolveIcon('f5xc:support'),
            },
          ],
        },
      ],
    },
  },
  {
    label: 'Tools',
    translations: menuLabels.Tools,
    content: {
      layout: 'list',
      categories: [
        {
          title: 'Developer Tools',
          translations: categoryTitles['Developer Tools'],
          items: [
            {
              label: 'VS Code Extension',
              translations: itemLabels['VS Code Extension'],
              description: 'Manage F5 XC resources from VS Code',
              descriptionTranslations: itemDescriptions['Manage F5 XC resources from VS Code'],
              href: 'https://f5xc-salesdemos.github.io/vscode-f5xc-tools/',
              icon: resolveIcon('carbon:code'),
            },
            {
              label: 'xcsh CLI',
              translations: itemLabels['xcsh CLI'],
              description: 'AI-powered CLI for F5 XC',
              descriptionTranslations: itemDescriptions['AI-powered CLI for F5 XC'],
              href: 'https://f5xc-salesdemos.github.io/xcsh/',
              icon: resolveIcon('carbon:terminal'),
            },
            {
              label: 'xcsh Chrome Extension',
              translations: itemLabels['xcsh Chrome Extension'],
              description: 'Drive the F5 XC console with xcsh',
              descriptionTranslations: itemDescriptions['Drive the F5 XC console with xcsh'],
              href: 'https://f5xc-salesdemos.github.io/xcsh-chrome-extension/',
              icon: resolveIcon('carbon:application-web'),
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
  { name: 'hashicorp-flight', loader: () => fetch('https://cdn.jsdelivr.net/npm/@f5xc-salesdemos/icons-hashicorp-flight/icons.json').then(r => r.json()) },
  { name: 'f5-brand', loader: () => fetch('https://cdn.jsdelivr.net/npm/@f5xc-salesdemos/icons-f5-brand/icons.json').then(r => r.json()) },
  { name: 'f5xc', loader: () => fetch('https://cdn.jsdelivr.net/npm/@f5xc-salesdemos/icons-f5xc/icons.json').then(r => r.json()) },
  { name: 'carbon', loader: () => fetch('https://cdn.jsdelivr.net/npm/@f5xc-salesdemos/icons-carbon/icons.json').then(r => r.json()) },
  { name: 'lucide', loader: () => fetch('https://cdn.jsdelivr.net/npm/@f5xc-salesdemos/icons-lucide/icons.json').then(r => r.json()) },
  { name: 'mdi', loader: () => fetch('https://cdn.jsdelivr.net/npm/@f5xc-salesdemos/icons-mdi/icons.json').then(r => r.json()) },
  { name: 'phosphor', loader: () => fetch('https://cdn.jsdelivr.net/npm/@f5xc-salesdemos/icons-phosphor/icons.json').then(r => r.json()) },
  { name: 'tabler', loader: () => fetch('https://cdn.jsdelivr.net/npm/@f5xc-salesdemos/icons-tabler/icons.json').then(r => r.json()) },
  { name: 'azure', loader: () => fetch('https://cdn.jsdelivr.net/npm/@f5xc-salesdemos/icons-azure/icons.json').then(r => r.json()) },
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

const federatedSearchSites = [
  { repo: 'docs-builder', label: 'Docs Builder' },
  { repo: 'docs-theme', label: 'Docs Theme' },
  { repo: 'docs', label: 'F5 XC Docs' },
  { repo: 'administration', label: 'Administration' },
  { repo: 'nginx', label: 'NGINX' },
  { repo: 'observability', label: 'Observability' },
  { repo: 'was', label: 'Web App Scanning' },
  { repo: 'mcn', label: 'Multi-Cloud Networking' },
  { repo: 'dns', label: 'DNS' },
  { repo: 'cdn', label: 'CDN' },
  { repo: 'bot-standard', label: 'Bot Standard' },
  { repo: 'bot-advanced', label: 'Bot Advanced' },
  { repo: 'ddos', label: 'DDoS' },
  { repo: 'waf', label: 'WAF' },
  { repo: 'api-protection', label: 'API Security' },
  { repo: 'xcsh', label: 'xcsh' },
  { repo: 'csd', label: 'Client-Side Defense' },
  { repo: 'docs-icons', label: 'Docs Icons' },
  { repo: 'devcontainer', label: 'Dev Container' },
  { repo: 'marketplace', label: 'Marketplace' },
  { repo: 'api-specs', label: 'API Specs' },
  { repo: 'api-specs-enriched', label: 'API Specs Enriched' },
  { repo: 'cdn-simulator', label: 'CDN Simulator' },
  { repo: 'origin-server', label: 'Origin Server' },
  { repo: 'traffic-generator', label: 'Traffic Generator' },
  { repo: 'demo-resources', label: 'Demo Resources' },
  { repo: 'xcsh-chrome-extension', label: 'xcsh Chrome Extension' },
];

export function createF5xcDocsConfig(options: F5xcDocsConfigOptions = {}) {
  const site = options.site || process.env.DOCS_SITE || 'https://f5xc-salesdemos.github.io';
  const base = options.base || process.env.DOCS_BASE || '/';
  const title = options.title || process.env.DOCS_TITLE || 'Documentation';
  const description = options.description || process.env.DOCS_DESCRIPTION || '';
  const githubRepository = options.githubRepository || process.env.GITHUB_REPOSITORY || '';
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
  const megaMenuItems = options.megaMenuItems || defaultMegaMenuItems;
  const head = options.head || defaultHead;
  const logo = options.logo || { src: '@f5xc-salesdemos/docs-theme/assets/f5-distributed-cloud.svg' };
  const additionalRemarkPlugins = options.additionalRemarkPlugins || [];
  const additionalIntegrations = options.additionalIntegrations || [];

  const federatedSearch = options.federatedSearch !== false;
  const normalizedBase = base.replace(/\/+$/, '');
  const mergeIndex = federatedSearch
    ? federatedSearchSites
        .filter((s) => `/${s.repo}` !== normalizedBase)
        .map((s) => ({
          bundlePath: `${site}/${s.repo}/pagefind/`,
        }))
    : undefined;

  const starlightPlugins: StarlightPlugin[] = [
    starlightMegaMenu({ items: megaMenuItems as Parameters<typeof starlightMegaMenu>[0]['items'], mobileLabels }),
    starlightVideosPlugin(),
    starlightImageZoom(),
    f5xcDocsTheme(),
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
    starlightHeadingBadges(),
    starlightPageActions(),
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
    starlightLlmsTxt({
      projectName: title,
      description,
      rawContent: false,
      optionalLinks: llmsOptionalLinks,
      sidebarNav: true,
      tieredHierarchy: true,
      promote: llmsConfig.promote || ['index*', 'overview*'],
      demote: llmsConfig.demote || ['references*'],
      ...(llmsFederatedSites.length > 0 ? { federatedSites: llmsFederatedSites } : {}),
      ...(llmsFederatedSiteCategories.length > 0 ? { federatedSiteCategories: llmsFederatedSiteCategories } : {}),
    }),
  ];

  const contentDir = process.env.CONTENT_DIR || 'src/content/docs';
  const subcategorySidebar = buildSubcategorySidebar(contentDir);

  // Auto-detect i18n: enable locales only when content has an en/ subdirectory.
  // Repos that haven't migrated to docs/en/ won't get a broken language selector.
  const hasEnSubdir = fs.existsSync(path.resolve(contentDir, 'en'));
  const resolvedLocales =
    options.locales === false ? undefined : options.locales || (hasEnSubdir ? f5xcDefaultLocales : undefined);
  const resolvedDefaultLocale = options.defaultLocale || f5xcDefaultLocale;

  const localeHeadScripts: HeadEntry[] = [];
  if (resolvedLocales) {
    const langToSlugMap = BCP47_TO_SLUG;
    const slugSet = JSON.stringify(SLUG_LIST);

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
    ...(resolvedLocales ? { redirects: { '/': `${normalizedBase}/${resolvedDefaultLocale}/` } } : {}),
    markdown: {
      remarkPlugins: [remarkMermaid, [codeImport, { allowImportingFromOutside: true }], ...additionalRemarkPlugins],
    },
    integrations: [
      starlight({
        title,
        plugins: starlightPlugins,
        head: [...((head as Parameters<typeof starlight>[0]['head']) || []), ...localeHeadScripts] as Parameters<
          typeof starlight
        >[0]['head'],
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
      ...additionalIntegrations,
    ],
  });
}
