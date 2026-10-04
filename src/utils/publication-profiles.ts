/** Repository publication decisions shared by navigation and site configuration. */
export const publicationProfiles: Record<
  string,
  { locales: Record<string, { label: string; lang: string }>; defaultLocale: string; favicon: string }
> = {
  'canada': {
    locales: { en: { label: 'English', lang: 'en' } },
    defaultLocale: 'en',
    favicon: '/assets/canada-favicon.svg',
  },
};

export function repositoryPublicationProfile(repository: string) {
  return publicationProfiles[repository.split('/').pop() || ''];
}
