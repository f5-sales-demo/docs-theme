import { defineConfig } from 'astro/config';
import type { AstroIntegration } from 'astro';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import f5xcDocsTheme from './index.ts';
import remarkMermaid from './src/plugins/remark-mermaid.mjs';
import starlightScrollToTop from 'starlight-scroll-to-top';
import starlightImageZoom from 'starlight-image-zoom';
import starlightHeadingBadges from 'starlight-heading-badges';
import starlightVideosPlugin from 'starlight-videos';
import starlightPageActions from 'starlight-page-actions';
import { starlightIconsPlugin } from 'starlight-plugin-icons';
import starlightLlmsTxt from 'starlight-llms-txt';
import starlightMegaMenu from 'starlight-mega-menu';
import type { StarlightPlugin } from '@astrojs/starlight/types';

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
    label: 'Products',
    content: {
      layout: 'grid',
      columns: 2,
      categories: [
        {
          title: 'App Security',
          items: [
            {
              label: 'Web App & API Protection',
              description: 'Comprehensive app and API security',
              href: '/products/waap/',
            },
            {
              label: 'Bot Defense',
              description: 'AI-driven bot mitigation',
              href: '/products/bot-defense/',
            },
          ],
        },
        {
          title: 'Networking',
          items: [
            {
              label: 'Multi-Cloud Networking',
              description: 'Connect apps across clouds',
              href: '/products/mcn/',
            },
            {
              label: 'DNS & DNS Load Balancing',
              description: 'Intelligent DNS services',
              href: '/products/dns/',
            },
          ],
        },
      ],
      footer: {
        label: 'View all products',
        href: '/products/',
        description: 'Explore the full F5 Distributed Cloud suite',
      },
    },
  },
  {
    label: 'Solutions',
    content: {
      layout: 'list',
      categories: [
        {
          title: 'By Use Case',
          items: [
            {
              label: 'API Security',
              description: 'Protect APIs across multi-cloud environments',
              href: '/solutions/api-security/',
            },
            {
              label: 'Multi-Cloud Networking',
              description: 'Secure connectivity across any cloud',
              href: '/solutions/multi-cloud/',
            },
            {
              label: 'Edge Computing',
              description: 'Deploy apps at the edge with F5 XC AppStack',
              href: '/solutions/edge/',
            },
          ],
        },
      ],
    },
  },
  {
    label: 'Docs',
    href: '/',
  },
  {
    label: 'Support',
    href: 'https://my.f5.com/manage/s/',
  },
];

const defaultHead: HeadEntry[] = [
  {
    tag: 'script',
    attrs: { type: 'module' },
    content: `import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs'; mermaid.initialize({ startOnLoad: true, theme: 'neutral' });`,
  },
];

export function createF5xcDocsConfig(options: F5xcDocsConfigOptions = {}) {
  const site = options.site || process.env.DOCS_SITE || 'https://f5xc-salesdemos.github.io';
  const base = options.base || process.env.DOCS_BASE || '/';
  const title = options.title || process.env.DOCS_TITLE || 'Documentation';
  const description = options.description || process.env.DOCS_DESCRIPTION || '';
  const githubRepository = options.githubRepository || process.env.GITHUB_REPOSITORY || '';
  const llmsOptionalLinks = options.llmsOptionalLinks
    || (process.env.LLMS_OPTIONAL_LINKS ? JSON.parse(process.env.LLMS_OPTIONAL_LINKS) : []);
  const megaMenuItems = options.megaMenuItems || defaultMegaMenuItems;
  const head = options.head || defaultHead;
  const logo = options.logo || { src: 'f5xc-docs-theme/assets/github-avatar.png' };
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
