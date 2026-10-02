import { fileURLToPath } from 'node:url';

// The archived menu package has a separate localizer that blindly adds language
// paths. Route both its desktop and mobile components through the theme policy.
export function menuLocalizationPolicy() {
  return {
    name: 'f5-menu-localization-policy',
    enforce: 'pre' as const,
    resolveId(source: string, importer?: string) {
      if (importer?.includes('/starlight-mega-menu/') && /(?:^|\/)localize-ecosystem-href(?:\.ts)?$/.test(source)) {
        return fileURLToPath(new URL('./localize-ecosystem-href.ts', import.meta.url));
      }
      return undefined;
    },
  };
}
