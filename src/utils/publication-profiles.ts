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
