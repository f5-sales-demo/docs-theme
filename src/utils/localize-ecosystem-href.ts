import { bcp47ToSlug, VALID_SLUGS } from '@f5-sales-demo/i18n-core';

const ECOSYSTEM_HOST = 'f5-sales-demo.github.io';

// Ecosystem sites published as a single locale (no `/<locale>/` path segment).
// Injecting a locale slug into links to these produces a 404
// (e.g. `/terraform-provider-xcsh/en/`), so they are left unlocalized.
const NON_LOCALIZED_ECOSYSTEM_SLUGS = new Set(['terraform-provider-xcsh', 'docs-control']);

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

  if (NON_LOCALIZED_ECOSYSTEM_SLUGS.has(segments[0])) return href;

  if (segments.length >= 2 && VALID_SLUGS.has(segments[1])) {
    return href;
  }

  segments.splice(1, 0, localeSlug);
  url.pathname = `/${segments.join('/')}/`;

  return url.toString();
}
