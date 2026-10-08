export function langToSlug(lang) {
  return lang.toLowerCase();
}
export function localizeEcosystemHref(href, locale) {
  const routing = globalThis.F5SharedRoutingV1;
  if (!routing?.locales.includes(locale)) return href;
  const url = new URL(href, document.baseURI);
  if (url.hostname !== 'f5-sales-demo.github.io') return href;
  const parts = url.pathname.split('/').filter(Boolean);
  if (!parts.length || routing.locales.includes(parts[0]) || routing.unlocalized.includes(parts[0])) return href;
  if (parts[1] && routing.locales.includes(parts[1])) return href;
  parts.splice(1, 0, routing.englishOnly.includes(parts[0]) ? 'en' : locale);
  url.pathname = `/${parts.join('/')}/`;
  return url.href;
}
