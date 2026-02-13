import type { StarlightPlugin } from '@astrojs/starlight/types';

export default function f5xcDocsTheme(): StarlightPlugin {
  return {
    name: 'f5xc-docs-theme',
    hooks: {
      'config:setup'({ config, updateConfig, addRouteMiddleware, logger }) {
        addRouteMiddleware({
          entrypoint: 'f5xc-docs-theme/route-middleware',
          order: 'pre',
        });
        updateConfig({
          customCss: [
            ...(config.customCss ?? []),
            'f5xc-docs-theme/fonts/font-face.css',
            'f5xc-docs-theme/styles/custom.css',
          ],
          components: {
            ...config.components,
            Banner: 'f5xc-docs-theme/components/Banner.astro',
            EditLink: 'f5xc-docs-theme/components/EditLink.astro',
            Footer: 'f5xc-docs-theme/components/Footer.astro',
            SiteTitle: 'f5xc-docs-theme/components/SiteTitle.astro',
            MarkdownContent: 'f5xc-docs-theme/components/MarkdownContent.astro',
          },
        });
        logger.info('F5 XC docs theme loaded');
      },
    },
  };
}
