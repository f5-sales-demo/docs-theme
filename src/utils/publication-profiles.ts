import type starlight from '@astrojs/starlight';

type Sidebar = NonNullable<Parameters<typeof starlight>[0]['sidebar']>;

interface PublicationProfile {
  locales: Record<string, { label: string; lang: string }>;
  defaultLocale: string;
  favicon: string;
  sidebar?: Sidebar;
}

/** Repository publication decisions shared by navigation and site configuration. */
export const publicationProfiles: Record<string, PublicationProfile> = {
  canada: {
    locales: { en: { label: 'English', lang: 'en' } },
    defaultLocale: 'en',
    favicon: '/assets/canada-favicon.svg',
    sidebar: [
      { slug: 'index' },
      { slug: 'use-case' },
      {
        label: 'Reference',
        collapsed: true,
        items: [
          { slug: 'architecture' },
          { slug: 'verification' },
          { slug: 'presentation' },
          { slug: 'terraform' },
          {
            label: 'Maintenance',
            collapsed: true,
            items: [{ slug: 'deployment' }, { slug: 'failover' }, { slug: 'troubleshooting' }, { slug: 'teardown' }],
          },
        ],
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
