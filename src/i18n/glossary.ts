import { categoryTitles, itemLabels, menuLabels } from './mega-menu-translations.ts';

const allTerms: Record<string, Record<string, string>> = {
  ...menuLabels,
  ...categoryTitles,
  ...itemLabels,
};

export function getGlossary(localeCode: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [english, translations] of Object.entries(allTerms)) {
    const translated = translations[localeCode];
    if (translated && translated !== english) {
      result[english] = translated;
    }
  }
  return result;
}
