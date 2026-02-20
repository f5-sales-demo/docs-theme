import type { StarlightPlugin } from '@astrojs/starlight/types';

export default function f5xcDocsTheme(): StarlightPlugin {
  return {
    name: '@f5xc-salesdemos/docs-theme',
    hooks: {
      'config:setup'({ config, updateConfig, addRouteMiddleware, logger }) {
        addRouteMiddleware({
          entrypoint: '@f5xc-salesdemos/docs-theme/route-middleware',
          order: 'pre',
        });
        updateConfig({
          customCss: [
            ...(config.customCss ?? []),
            '@f5xc-salesdemos/docs-theme/fonts/font-face.css',
            '@f5xc-salesdemos/docs-theme/styles/custom.css',
          ],
          components: {
            ...config.components,
            Banner: '@f5xc-salesdemos/docs-theme/components/Banner.astro',
            EditLink: '@f5xc-salesdemos/docs-theme/components/EditLink.astro',
            Footer: '@f5xc-salesdemos/docs-theme/components/Footer.astro',
            SiteTitle: '@f5xc-salesdemos/docs-theme/components/SiteTitle.astro',
            MarkdownContent:
              process.env.DOCS_MARKDOWN_CONTENT || '@f5xc-salesdemos/docs-theme/components/MarkdownContent.astro',
          },
        });
        logger.info('F5 XC docs theme loaded');
      },
    },
  };
}
