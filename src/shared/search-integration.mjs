// Keep Starlight's Search and Pagefind implementation local; inject only release-owned federation.
export function sharedSearchIntegration() {
  return {
    name: 'f5-shared-search',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('/@astrojs/starlight/components/Search.astro')) return;
      return code
        .replace('...pagefindUserConfig,', '...pagefindUserConfig, ...(window.F5SharedSearchV1 || {}),')
        .replace(
          'const { PagefindUI } = await import',
          'await window.F5SharedReadyV1; const { PagefindUI } = await import',
        );
    },
  };
}
