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
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>',
            },
            {
              label: 'API Security',
              description: 'API discovery and protection',
              href: 'https://f5xc-salesdemos.github.io/api/',
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="16" r="1"/><rect x="3" y="10" width="18" height="12" rx="2"/><path d="M7 10V7a5 5 0 0 1 10 0v3"/></svg>',
            },
            {
              label: 'Client-Side Defense',
              description: 'Browser-based threat protection',
              href: 'https://f5xc-salesdemos.github.io/csd/',
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 10 2 2 4-4"/><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M12 17v4"/><path d="M8 21h8"/></svg>',
            },
            {
              label: 'Web App Scanning',
              description: 'Vulnerability assessment and scanning',
              href: 'https://f5xc-salesdemos.github.io/was/',
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/><path d="m16 16-1.9-1.9"/></svg>',
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
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>',
            },
            {
              label: 'Bot Defense Standard',
              description: 'Signature-based bot detection',
              href: 'https://f5xc-salesdemos.github.io/bot-standard/',
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m4.243 5.21 14.39 12.472"/></svg>',
            },
            {
              label: 'DDoS Protection',
              description: 'Distributed denial-of-service mitigation',
              href: 'https://f5xc-salesdemos.github.io/ddos/',
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>',
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
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/></svg>',
            },
            {
              label: 'Content Delivery',
              description: 'Edge caching and distribution',
              href: 'https://f5xc-salesdemos.github.io/cdn/',
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
            },
            {
              label: 'DNS Load Balancing',
              description: 'DNS management and zones',
              href: 'https://f5xc-salesdemos.github.io/dns/',
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>',
            },
            {
              label: 'NGINX Management',
              description: 'NGINX integration and configuration',
              href: 'https://f5xc-salesdemos.github.io/nginx/',
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/></svg>',
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
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>',
            },
            {
              label: 'Administration',
              description: 'Tenant management and RBAC',
              href: 'https://f5xc-salesdemos.github.io/administration/',
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>',
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
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172v-.344a2 2 0 0 0-.586-1.414l-1.657-1.657A6 6 0 0 0 12.516 3H9l1.243 1.243A6 6 0 0 1 12 8.485V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/></svg>',
            },
            {
              label: 'Docs Theme',
              description: 'Shared branding and styling',
              href: 'https://f5xc-salesdemos.github.io/docs-theme/',
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z"/><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/></svg>',
            },
            {
              label: 'Icon Packages',
              description: 'NPM icon component library',
              href: 'https://f5xc-salesdemos.github.io/docs-icons/',
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><polyline points="3.29 7 12 12 20.71 7"/><path d="m7.5 4.27 9 5.15"/></svg>',
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
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>',
            },
            {
              label: 'F5 Cloud Docs',
              description: 'Official product documentation',
              href: 'https://docs.cloud.f5.com',
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>',
            },
            {
              label: 'MyF5 Support',
              description: 'Technical support portal',
              href: 'https://my.f5.com/manage/s/',
              icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/></svg>',
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
