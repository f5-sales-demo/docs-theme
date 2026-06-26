import { DEFAULT_LOCALE, type StarlightLocaleConfig, toStarlightLocales } from '@f5-sales-demo/i18n-core';

export type LocaleConfig = StarlightLocaleConfig;

export const f5xcDefaultLocales = toStarlightLocales();

export const defaultLocale = DEFAULT_LOCALE;
