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
  'certificate-management': {
    locales: { en: { label: 'English', lang: 'en' } },
    defaultLocale: 'en',
    sidebar: [
      { label: 'Overview', slug: 'index' },
      {
        label: 'xcsh',
        collapsed: true,
        items: [
          { label: 'Overview', slug: 'xcsh' },
          { label: 'Prerequisites', slug: 'xcsh/prerequisites' },
          { label: 'Configuration', slug: 'xcsh/configuration' },
          { label: 'Configure', slug: 'xcsh/configure' },
          { label: 'Verify', slug: 'xcsh/verify' },
          { label: 'Maintain', slug: 'xcsh/maintain' },
          { label: 'Remove', slug: 'xcsh/remove' },
          { label: 'Input variants', slug: 'xcsh/input-workflows' },
          { label: 'Command reference', slug: 'xcsh/command-reference' },
        ],
      },
      {
        label: 'Terraform',
        collapsed: true,
        items: [
          { label: 'Overview', slug: 'terraform' },
          { label: 'Prerequisites', slug: 'terraform/prerequisites' },
          { label: 'Configuration', slug: 'terraform/configuration' },
          { label: 'Configure', slug: 'terraform/configure' },
          { label: 'Verify', slug: 'terraform/verify' },
          { label: 'Maintain', slug: 'terraform/maintain' },
          { label: 'Remove', slug: 'terraform/remove' },
          { label: 'Inputs and lifecycle', slug: 'terraform/input-lifecycle' },
          { label: 'Qualification campaign', slug: 'terraform/campaign' },
          {
            label: 'Certificate types',
            collapsed: true,
            items: [
              { label: 'Choose configuration', slug: 'terraform/certificate-surfaces' },
              { label: 'Advertise TLS', slug: 'terraform/certificate-surfaces/advertise-tls' },
              { label: 'CDN origin mTLS', slug: 'terraform/certificate-surfaces/cdn-origin-mtls' },
              { label: 'CDN server TLS', slug: 'terraform/certificate-surfaces/cdn-server-tls' },
              { label: 'Cluster TLS', slug: 'terraform/certificate-surfaces/cluster-tls' },
              { label: 'Default pool mTLS', slug: 'terraform/certificate-surfaces/http-origin-mtls' },
              { label: 'Inline server TLS', slug: 'terraform/certificate-surfaces/inline-server-tls' },
              { label: 'Origin mTLS', slug: 'terraform/certificate-surfaces/origin-mtls' },
              { label: 'TLS interception', slug: 'terraform/certificate-surfaces/proxy-intercept' },
              { label: 'Proxy TLS', slug: 'terraform/certificate-surfaces/proxy-tls' },
              { label: 'Secret access TLS', slug: 'terraform/certificate-surfaces/secret-access-tls' },
              { label: 'TCP TLS', slug: 'terraform/certificate-surfaces/tcp-tls' },
              { label: 'Virtual host TLS', slug: 'terraform/certificate-surfaces/virtual-host-tls' },
              { label: 'Custom workload TLS', slug: 'terraform/certificate-surfaces/workload-service-custom' },
              { label: 'Multiport workload TLS', slug: 'terraform/certificate-surfaces/workload-service-public-multi' },
              { label: 'Workload TLS', slug: 'terraform/certificate-surfaces/workload-service-public-single' },
            ],
          },
        ],
      },
      {
        label: 'Client mTLS',
        collapsed: true,
        items: [
          { label: 'Overview', slug: 'client-mtls' },
          { label: 'Prerequisites', slug: 'client-mtls/prerequisites' },
          { label: 'Configuration', slug: 'client-mtls/configuration' },
          { label: 'Configure', slug: 'client-mtls/configure' },
          { label: 'Verify', slug: 'client-mtls/verify' },
          { label: 'Maintain', slug: 'client-mtls/maintain' },
          { label: 'Remove', slug: 'client-mtls/remove' },
        ],
      },
      {
        label: 'Wingman',
        collapsed: true,
        items: [
          { label: 'Overview', slug: 'wingman' },
          { label: 'Prerequisites', slug: 'wingman/prerequisites' },
          { label: 'Configuration', slug: 'wingman/configuration' },
          { label: 'Configure', slug: 'wingman/configure' },
          { label: 'Verify', slug: 'wingman/verify' },
          { label: 'Maintain', slug: 'wingman/maintain' },
          { label: 'Remove', slug: 'wingman/remove' },
          { label: 'Infrastructure', slug: 'wingman/validation' },
        ],
      },
    ],
  },

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
