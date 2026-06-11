const ECOSYSTEM_HOST = 'f5xc-salesdemos.github.io';

const VALID_LOCALE_SLUGS = new Set([
  'en',
  'fr',
  'es',
  'de',
  'pt-br',
  'ja',
  'ko',
  'zh-cn',
  'zh-tw',
  'ar',
  'it',
  'hi',
  'th',
]);

const LANG_TO_SLUG: Record<string, string> = {
  'pt-BR': 'pt-br',
  'zh-CN': 'zh-cn',
  'zh-TW': 'zh-tw',
};

export function langToSlug(lang: string): string {
  return LANG_TO_SLUG[lang] || lang.toLowerCase();
}

export function localizeEcosystemHref(
  href: string,
  localeSlug: string,
  ecosystemHost: string = ECOSYSTEM_HOST,
): string {
  if (!localeSlug || !VALID_LOCALE_SLUGS.has(localeSlug)) return href;

  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return href;
  }

  if (url.hostname !== ecosystemHost) return href;

  const segments = url.pathname.split('/').filter(Boolean);
  if (segments.length === 0) return href;

  if (segments.length >= 2 && VALID_LOCALE_SLUGS.has(segments[1])) {
    return href;
  }

  segments.splice(1, 0, localeSlug);
  url.pathname = `/${segments.join('/')}/`;

  return url.toString();
}
