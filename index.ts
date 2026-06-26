import type { StarlightPlugin } from '@astrojs/starlight/types';
import { translations } from './src/i18n/translations.ts';

export default function f5xcDocsTheme(): StarlightPlugin {
  return {
    name: '@f5-sales-demo/docs-theme',
    hooks: {
      'i18n:setup'({ injectTranslations }) {
        injectTranslations(translations);
      },
      'config:setup'({ config, updateConfig, addRouteMiddleware, logger }) {
        addRouteMiddleware({
          entrypoint: '@f5-sales-demo/docs-theme/route-middleware',
          order: 'pre',
        });
        updateConfig({
          customCss: [
            ...(config.customCss ?? []),
            '@f5-sales-demo/docs-theme/fonts/font-face.css',
            '@f5-sales-demo/docs-theme/styles/custom.css',
          ],
          components: {
            ...config.components,
            Banner: '@f5-sales-demo/docs-theme/components/Banner.astro',
            EditLink: '@f5-sales-demo/docs-theme/components/EditLink.astro',
            Footer: '@f5-sales-demo/docs-theme/components/Footer.astro',
            SiteTitle: '@f5-sales-demo/docs-theme/components/SiteTitle.astro',
            MarkdownContent:
              process.env.DOCS_MARKDOWN_CONTENT || '@f5-sales-demo/docs-theme/components/MarkdownContent.astro',
          },
        });
        logger.info('F5 XC docs theme loaded');
      },
    },
  };
}
