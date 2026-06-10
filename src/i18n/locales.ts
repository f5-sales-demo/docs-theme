export interface LocaleConfig {
  label: string;
  lang: string;
  dir?: 'rtl';
}

export const f5xcDefaultLocales = {
  en: { label: 'English', lang: 'en' },
  fr: { label: 'Français', lang: 'fr' },
  es: { label: 'Español', lang: 'es' },
  de: { label: 'Deutsch', lang: 'de' },
  'pt-br': { label: 'Português (Brasil)', lang: 'pt-BR' },
  ja: { label: '日本語', lang: 'ja' },
  ko: { label: '한국어', lang: 'ko' },
  'zh-cn': { label: '简体中文', lang: 'zh-CN' },
  'zh-tw': { label: '繁體中文', lang: 'zh-TW' },
  ar: { label: 'العربية', lang: 'ar', dir: 'rtl' as const },
  it: { label: 'Italiano', lang: 'it' },
  hi: { label: 'हिन्दी', lang: 'hi' },
  th: { label: 'ไทย', lang: 'th' },
} as const satisfies Record<string, LocaleConfig>;

export const defaultLocale = 'en';
