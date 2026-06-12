import { bcp47ToSlug, VALID_SLUGS } from '@f5xc-salesdemos/i18n-core';

const ECOSYSTEM_HOST = 'f5xc-salesdemos.github.io';

export const langToSlug = bcp47ToSlug;

export function localizeEcosystemHref(
  href: string,
  localeSlug: string,
  ecosystemHost: string = ECOSYSTEM_HOST,
): string {
  if (!localeSlug || !VALID_SLUGS.has(localeSlug)) return href;

  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return href;
  }

  if (url.hostname !== ecosystemHost) return href;

  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length === 0) return href;

  if (segments.length >= 2 && VALID_SLUGS.has(segments[1])) {
    return href;
  }

  segments.splice(1, 0, localeSlug);
  url.pathname = `/${segments.join('/')}/`;

  return url.toString();
}
