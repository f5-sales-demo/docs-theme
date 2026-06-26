import { describe, expect, it } from 'vitest';
import { langToSlug, localizeEcosystemHref } from './localize-ecosystem-href';

describe('langToSlug', () => {
  it('converts BCP-47 codes with region to lowercase slugs', () => {
    expect(langToSlug('pt-BR')).toBe('pt-br');
    expect(langToSlug('zh-CN')).toBe('zh-cn');
    expect(langToSlug('zh-TW')).toBe('zh-tw');
  });

  it('passes through simple language codes unchanged', () => {
    expect(langToSlug('en')).toBe('en');
    expect(langToSlug('fr')).toBe('fr');
    expect(langToSlug('ar')).toBe('ar');
  });

  it('lowercases unknown codes as fallback', () => {
    expect(langToSlug('sv-SE')).toBe('sv-se');
  });
});

describe('localizeEcosystemHref', () => {
  it('injects locale slug into ecosystem URLs', () => {
    const result = localizeEcosystemHref('https://f5-sales-demo.github.io/waf/', 'fr');
    expect(result).toBe('https://f5-sales-demo.github.io/waf/fr/');
  });

  it('does not double-inject if locale already present', () => {
    const result = localizeEcosystemHref('https://f5-sales-demo.github.io/waf/fr/', 'fr');
    expect(result).toBe('https://f5-sales-demo.github.io/waf/fr/');
  });

  it('returns href unchanged for non-ecosystem hosts', () => {
    const result = localizeEcosystemHref('https://example.com/waf/', 'fr');
    expect(result).toBe('https://example.com/waf/');
  });

  it('returns href unchanged for invalid locale slug', () => {
    const result = localizeEcosystemHref('https://f5-sales-demo.github.io/waf/', 'xx-invalid');
    expect(result).toBe('https://f5-sales-demo.github.io/waf/');
  });

  it('returns href unchanged for empty locale', () => {
    const result = localizeEcosystemHref('https://f5-sales-demo.github.io/waf/', '');
    expect(result).toBe('https://f5-sales-demo.github.io/waf/');
  });

  it('returns invalid URLs unchanged', () => {
    const result = localizeEcosystemHref('not-a-url', 'fr');
    expect(result).toBe('not-a-url');
  });

  it('works with all 13 supported locale slugs', () => {
    const slugs = ['en', 'fr', 'es', 'de', 'pt-br', 'ja', 'ko', 'zh-cn', 'zh-tw', 'ar', 'it', 'hi', 'th'];
    for (const slug of slugs) {
      const result = localizeEcosystemHref('https://f5-sales-demo.github.io/waf/', slug);
      expect(result).toContain(`/${slug}/`);
    }
  });

  it('supports custom ecosystem host', () => {
    const result = localizeEcosystemHref('https://custom.host.io/waf/', 'fr', 'custom.host.io');
    expect(result).toBe('https://custom.host.io/waf/fr/');
  });
});
