import { describe, expect, it } from 'vitest';
import { defaultLocale, f5xcDefaultLocales } from './locales';

describe('f5xcDefaultLocales', () => {
  it('contains 13 locales', () => {
    expect(Object.keys(f5xcDefaultLocales)).toHaveLength(13);
  });

  it('uses slug format for keys', () => {
    for (const key of Object.keys(f5xcDefaultLocales)) {
      expect(key).toMatch(/^[a-z]+(-[a-z]+)?$/);
    }
  });

  it('has BCP-47 lang property for each locale', () => {
    for (const [_slug, config] of Object.entries(f5xcDefaultLocales)) {
      expect(config.lang).toBeTruthy();
      expect(config.label).toBeTruthy();
    }
  });

  it('maps pt-br to BCP-47 pt-BR', () => {
    expect(f5xcDefaultLocales['pt-br'].lang).toBe('pt-BR');
  });

  it('maps zh-cn to BCP-47 zh-CN', () => {
    expect(f5xcDefaultLocales['zh-cn'].lang).toBe('zh-CN');
  });

  it('maps zh-tw to BCP-47 zh-TW', () => {
    expect(f5xcDefaultLocales['zh-tw'].lang).toBe('zh-TW');
  });

  it('has RTL dir only for Arabic', () => {
    expect(f5xcDefaultLocales.ar.dir).toBe('rtl');
    expect(f5xcDefaultLocales.en.dir).toBeUndefined();
    expect(f5xcDefaultLocales.fr.dir).toBeUndefined();
  });

  it('includes all expected locales', () => {
    const expected = ['en', 'fr', 'es', 'de', 'pt-br', 'ja', 'ko', 'zh-cn', 'zh-tw', 'ar', 'it', 'hi', 'th'];
    for (const slug of expected) {
      expect(f5xcDefaultLocales).toHaveProperty(slug);
    }
  });
});

describe('defaultLocale', () => {
  it('is "en"', () => {
    expect(defaultLocale).toBe('en');
  });

  it('exists in f5xcDefaultLocales', () => {
    expect(f5xcDefaultLocales).toHaveProperty(defaultLocale);
  });
});
