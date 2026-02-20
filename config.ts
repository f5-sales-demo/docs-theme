import react from '@astrojs/react';
import starlight from '@astrojs/starlight';
import type { StarlightPlugin } from '@astrojs/starlight/types';
import type { AstroIntegration } from 'astro';
import { defineConfig } from 'astro/config';
import starlightHeadingBadges from 'starlight-heading-badges';
import starlightImageZoom from 'starlight-image-zoom';
import starlightLlmsTxt from 'starlight-llms-txt';
import starlightMegaMenu from 'starlight-mega-menu';
import starlightPageActions from 'starlight-page-actions';
import { starlightIconsPlugin } from 'starlight-plugin-icons';
import starlightScrollToTop from 'starlight-scroll-to-top';
import starlightVideosPlugin from 'starlight-videos';
import f5xcDocsTheme from './index.ts';
import remarkMermaid from './src/plugins/remark-mermaid.mjs';
import { resolveIcon } from './src/utils/resolve-icon.ts';

interface MegaMenuItem {
  label: string;
  href?: string;
  content?: {
    layout?: string;
    columns?: number;
    categories?: Array<{
      title: string;
      items: Array<{
        label: string;
        description?: string;
        href: string;
        icon?: string;
      }>;
    }>;
    footer?: {
      label: string;
      href: string;
      description?: string;
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
}

const defaultMegaMenuItems: MegaMenuItem[] = [
  {
    label: 'Security',
    content: {
      layout: 'grid',
      columns: 2,
      categories: [
        {
          title: 'App & API Security',
          items: [
            {
              label: 'Web App Firewall',
              description: 'Firewall policies and configuration',
              href: 'https://f5xc-salesdemos.github.io/waf/',
              icon: resolveIcon('f5xc:web-app-and-api-protection'),
            },
            {
              label: 'API Security',
              description: 'API discovery and protection',
              href: 'https://f5xc-salesdemos.github.io/api-protection/',
              icon: resolveIcon('f5xc:application-traffic-insight'),
            },
            {
              label: 'Client-Side Defense',
              description: 'Browser-based threat protection',
              href: 'https://f5xc-salesdemos.github.io/csd/',
              icon: resolveIcon('f5xc:client-side-defense'),
            },
            {
              label: 'Web App Scanning',
              description: 'Vulnerability assessment and scanning',
              href: 'https://f5xc-salesdemos.github.io/was/',
              icon: resolveIcon('f5xc:web-app-scanning'),
            },
          ],
        },
        {
          title: 'Threat Defense',
          items: [
            {
              label: 'Bot Defense Advanced',
              description: 'Behavioral analysis and AI detection',
              href: 'https://f5xc-salesdemos.github.io/bot-advanced/',
              icon: resolveIcon('f5xc:bot-defense'),
            },
            {
              label: 'Bot Defense Standard',
              description: 'Signature-based bot detection',
              href: 'https://f5xc-salesdemos.github.io/bot-standard/',
              icon: resolveIcon('f5xc:bot-defense'),
            },
            {
              label: 'DDoS Protection',
              description: 'Distributed denial-of-service mitigation',
              href: 'https://f5xc-salesdemos.github.io/ddos/',
              icon: resolveIcon('f5xc:ddos-and-transit-services'),
            },
          ],
        },
      ],
      footer: {
        label: 'F5 Distributed Cloud Console',
        href: 'https://console.ves.volterra.io',
        description: 'Open the XC management portal',
      },
    },
  },
  {
    label: 'Networking',
    content: {
      layout: 'grid',
      columns: 2,
      categories: [
        {
          title: 'Connectivity & Delivery',
          items: [
            {
              label: 'Multi-Cloud Networking',
              description: 'Site connectivity across clouds',
              href: 'https://f5xc-salesdemos.github.io/mcn/',
              icon: resolveIcon('f5xc:multi-cloud-network-connect'),
            },
            {
              label: 'Content Delivery',
              description: 'Edge caching and distribution',
              href: 'https://f5xc-salesdemos.github.io/cdn/',
              icon: resolveIcon('f5xc:content-delivery-network'),
            },
            {
              label: 'DNS Load Balancing',
              description: 'DNS management and zones',
              href: 'https://f5xc-salesdemos.github.io/dns/',
              icon: resolveIcon('f5xc:dns-management'),
            },
            {
              label: 'NGINX Management',
              description: 'NGINX integration and configuration',
              href: 'https://f5xc-salesdemos.github.io/nginx/',
              icon: resolveIcon('f5xc:nginx-one'),
            },
          ],
        },
        {
          title: 'Manage & Monitor',
          items: [
            {
              label: 'Observability',
              description: 'Monitoring, metrics, and insights',
              href: 'https://f5xc-salesdemos.github.io/observability/',
              icon: resolveIcon('f5xc:observability'),
            },
            {
              label: 'Administration',
              description: 'Tenant management and RBAC',
              href: 'https://f5xc-salesdemos.github.io/administration/',
              icon: resolveIcon('f5xc:administration'),
            },
          ],
        },
      ],
      footer: {
        label: 'F5 Cloud Documentation',
        href: 'https://docs.cloud.f5.com',
        description: 'Official product documentation',
      },
    },
  },
  {
    label: 'Platform',
    content: {
      layout: 'list',
      categories: [
        {
          title: 'Documentation Tools',
          items: [
            {
              label: 'Docs Builder',
              description: 'Containerized Astro build system',
              href: 'https://f5xc-salesdemos.github.io/docs-builder/',
              icon: resolveIcon('f5xc:doc'),
            },
            {
              label: 'Docs Theme',
              description: 'Shared branding and styling',
              href: 'https://f5xc-salesdemos.github.io/docs-theme/',
              icon: resolveIcon('f5xc:shared-configuration'),
            },
            {
              label: 'Icon Packages',
              description: 'NPM icon component library',
              href: 'https://f5xc-salesdemos.github.io/docs-icons/',
              icon: resolveIcon('f5xc:distributed-apps'),
            },
          ],
        },
      ],
      footer: {
        label: 'GitHub Organization',
        href: 'https://github.com/f5xc-salesdemos',
        description: 'View all repositories',
      },
    },
  },
  {
    label: 'AI',
    content: {
      layout: 'list',
      categories: [
        {
          title: 'AI Tools',
          items: [
            {
              label: 'API MCP Server',
              description: 'MCP server for F5 XC API',
              href: 'https://f5xc-salesdemos.github.io/api-mcp/',
              icon: resolveIcon('f5xc:ai_assistant_logo'),
            },
          ],
        },
      ],
    },
  },
  {
    label: 'Resources',
    content: {
      layout: 'list',
      categories: [
        {
          title: 'F5 Ecosystem',
          items: [
            {
              label: 'F5 XC Console',
              description: 'Distributed Cloud management portal',
              href: 'https://console.ves.volterra.io',
              icon: resolveIcon('f5xc:platform'),
            },
            {
              label: 'F5 Cloud Docs',
              description: 'Official product documentation',
              href: 'https://docs.cloud.f5.com',
              icon: resolveIcon('f5xc:doc'),
            },
            {
              label: 'MyF5 Support',
              description: 'Technical support portal',
              href: 'https://my.f5.com/manage/s/',
              icon: resolveIcon('f5xc:support'),
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

export function createF5xcDocsConfig(options: F5xcDocsConfigOptions = {}) {
  const site = options.site || process.env.DOCS_SITE || 'https://f5xc-salesdemos.github.io';
  const base = options.base || process.env.DOCS_BASE || '/';
  const title = options.title || process.env.DOCS_TITLE || 'Documentation';
  const description = options.description || process.env.DOCS_DESCRIPTION || '';
  const githubRepository = options.githubRepository || process.env.GITHUB_REPOSITORY || '';
  const llmsOptionalLinks =
    options.llmsOptionalLinks || (process.env.LLMS_OPTIONAL_LINKS ? JSON.parse(process.env.LLMS_OPTIONAL_LINKS) : []);
  const megaMenuItems = options.megaMenuItems || defaultMegaMenuItems;
  const head = options.head || defaultHead;
  const logo = options.logo || { src: '@f5xc-salesdemos/docs-theme/assets/f5-distributed-cloud.svg' };
  const additionalRemarkPlugins = options.additionalRemarkPlugins || [];
  const additionalIntegrations = options.additionalIntegrations || [];

  const starlightPlugins: StarlightPlugin[] = [
    starlightMegaMenu({ items: megaMenuItems as Parameters<typeof starlightMegaMenu>[0]['items'] }),
    starlightVideosPlugin(),
    starlightImageZoom(),
    f5xcDocsTheme(),
    starlightScrollToTop({
      showTooltip: true,
      tooltipText: 'Scroll to top',
      smoothScroll: true,
      threshold: 10,
      showProgressRing: true,
      progressRingColor: '#e4002b',
      showOnHomepage: false,
    }),
    starlightHeadingBadges(),
    starlightPageActions(),
    starlightIconsPlugin(),
    starlightLlmsTxt({
      projectName: title,
      description,
      rawContent: true,
      optionalLinks: llmsOptionalLinks,
    }),
  ];

  return defineConfig({
    site,
    base,
    markdown: {
      remarkPlugins: [remarkMermaid, ...additionalRemarkPlugins],
    },
    integrations: [
      starlight({
        title,
        plugins: starlightPlugins,
        head: head as Parameters<typeof starlight>[0]['head'],
        logo: logo as Parameters<typeof starlight>[0]['logo'],
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
