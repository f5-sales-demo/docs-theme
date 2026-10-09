import type starlight from '@astrojs/starlight';

type Sidebar = NonNullable<Parameters<typeof starlight>[0]['sidebar']>;

interface PublicationProfile {
  locales: Record<string, { label: string; lang: string }>;
  defaultLocale: string;
  favicon?: string;
  sidebar?: Sidebar;
}

/** Repository publication decisions shared by navigation and site configuration. */
export const publicationProfiles: Record<string, PublicationProfile> = {
  statistics: {
    locales: { en: { label: 'English', lang: 'en' } },
    defaultLocale: 'en',
    sidebar: [
      { slug: 'index' },
      { slug: 'access-logs' },
      { slug: 'service-graph' },
      { slug: 'origin-performance' },
      { slug: 'application-health' },
      { slug: 'api-discovery' },
      { slug: 'firewall-metrics' },
      { slug: 'security-events' },
      { slug: 'troubleshooting' },
      {
        label: 'Statistics APIs',
        collapsed: true,
        items: [
          { label: 'Overview', slug: 'api-catalog' },
          { label: 'Query concepts', slug: 'api-catalog/query-concepts' },
          { label: 'Application traffic', slug: 'api-catalog/application-traffic' },
          { label: 'API analytics', slug: 'api-catalog/api-analytics' },
          { label: 'Application security', slug: 'api-catalog/application-security' },
          { label: 'Bot defense', slug: 'api-catalog/bot-defense' },
          { label: 'Client-side defense', slug: 'api-catalog/client-side-defense' },
          { label: 'Device intelligence', slug: 'api-catalog/device-data-intelligence' },
          { label: 'DDoS protection', slug: 'api-catalog/ddos-protection' },
          { label: 'DNS', slug: 'api-catalog/dns' },
          { label: 'CDN', slug: 'api-catalog/cdn' },
          { label: 'Networking', slug: 'api-catalog/networking' },
          { label: 'Kubernetes & storage', slug: 'api-catalog/kubernetes-storage' },
          { label: 'Logs & events', slug: 'api-catalog/logs-events-alerts' },
          { label: 'Synthetic monitoring', slug: 'api-catalog/synthetic-monitoring' },
          { label: 'Billing & usage', slug: 'api-catalog/billing-usage' },
        ],
      },
      { slug: 'setup' },
      { slug: 'shell-scripts' },
      {
        label: 'Infrastructure',
        collapsed: true,
        items: [{ slug: 'deployment' }, { slug: 'verification' }],
      },
    ],
  },
  canada: {
    locales: { en: { label: 'English', lang: 'en' } },
    defaultLocale: 'en',
    favicon: '/assets/canada-favicon.svg',
    sidebar: [
      { slug: 'index' },
      {
        label: 'Design',
        collapsed: true,
        items: [{ slug: 'design' }, { slug: 'use-case' }, { slug: 'architecture' }],
      },
      {
        label: 'Deploy',
        collapsed: true,
        items: [{ slug: 'deploy' }, { slug: 'deployment' }, { slug: 'terraform' }],
      },
      {
        label: 'Verify',
        collapsed: true,
        items: [{ slug: 'verify' }, { slug: 'presentation' }, { slug: 'verification' }],
      },
      {
        label: 'Operate',
        collapsed: true,
        items: [{ slug: 'operate' }, { slug: 'troubleshooting' }, { slug: 'failover' }, { slug: 'teardown' }],
      },
    ],
  },
};

export function repositoryPublicationProfile(repository: string) {
  return publicationProfiles[repository.split('/').pop() || ''];
}

/** Preserve automatic navigation unless this repository explicitly supplies a sidebar. */
export function publicationSidebar(repository: string, fallback: Sidebar | undefined) {
  return repositoryPublicationProfile(repository)?.sidebar ?? fallback;
}
