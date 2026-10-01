import fs from 'node:fs';
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import type { ProviderPage } from './src/utils/canonical-provider.ts';
import { collectionNavigation, providerSections } from './src/utils/canonical-provider.ts';

let providerNavigation: { collections: Record<string, ProviderPage[]> };
export const onRequest = defineRouteMiddleware(async (context, next) => {
  const route = context.locals.starlightRoute;
  const entry = route.entry;
  const canonical = process.env.DOCS_PROFILE === 'canonical-provider';
  if (canonical) {
    providerNavigation ||= JSON.parse(fs.readFileSync(process.env.PROVIDER_NAVIGATION || '', 'utf8'));
    const metadata = entry.data.xcsh_docs;
    const base = import.meta.env.BASE_URL;
    const sections = providerSections.map((section) => ({
      type: 'link' as const,
      label: section.label,
      href: `${base.replace(/\/$/, '')}/${section.path}/`,
      isCurrent: route.id === section.path,
      badge: undefined,
      attrs: {},
    }));
    route.sidebar = [
      ...sections,
      ...(metadata
        ? collectionNavigation(
            providerNavigation.collections[metadata.collection_id] || [],
            metadata.collection_id,
            base,
            route.id,
          )
        : []),
    ];
    route.hasSidebar = true;
    route.pagination = { prev: undefined, next: undefined };
    route.siteTitleHref = base;
  }

  await next();
});
