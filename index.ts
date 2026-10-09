import type { StarlightPlugin } from '@astrojs/starlight/types';
import { translations } from './src/i18n/translations.ts';
import { sharedMode } from './src/shared/settings.mjs';

export default function f5xcDocsTheme(repository = process.env.GITHUB_REPOSITORY || ''): StarlightPlugin {
  return {
    name: '@f5-sales-demo/docs-theme',
    hooks: {
      'i18n:setup'({ injectTranslations }) {
        injectTranslations(translations);
      },
      'config:setup'({ config, updateConfig, addRouteMiddleware, logger }) {
        addRouteMiddleware({
          entrypoint:
            process.env.DOCS_PROFILE === 'canonical-provider'
              ? '@f5-sales-demo/docs-theme/canonical-route-middleware'
              : '@f5-sales-demo/docs-theme/route-middleware',
          order: process.env.DOCS_PROFILE === 'canonical-provider' ? 'post' : 'pre',
        });
        updateConfig({
          customCss: [
            ...(config.customCss ?? []),
            ...(sharedMode(repository) === 'local'
              ? [
                  '@f5-sales-demo/docs-theme/fonts/font-face.css',
                  '@f5-sales-demo/docs-theme/styles/custom.css',
                  '@f5-sales-demo/docs-theme/styles/shell.css',
                ]
              : []),
          ],
          components: {
            ...config.components,
            Header:
              sharedMode(repository) === 'local'
                ? '@f5-sales-demo/docs-theme/components/LocalHeader.astro'
                : '@f5-sales-demo/docs-theme/components/SharedHeader.astro',
            Head: '@f5-sales-demo/docs-theme/components/Head.astro',
            ...(process.env.DOCS_PROFILE === 'canonical-provider'
              ? {
                  Sidebar: '@f5-sales-demo/docs-theme/components/ProviderSidebar.astro',
                }
              : repository === 'f5-sales-demo/canada'
                ? {
                    Sidebar: '@f5-sales-demo/docs-theme/components/CanadaSidebar.astro',
                  }
                : repository.split('/').pop() === 'statistics'
                  ? { Sidebar: '@f5-sales-demo/docs-theme/components/StatisticsSidebar.astro' }
                  : {}),
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
