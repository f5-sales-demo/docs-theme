import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import type { StarlightRouteData } from '@astrojs/starlight/route-data';

type SidebarEntry = StarlightRouteData['sidebar'][number];

function isIndexPage(filePath: string | undefined): boolean {
  if (!filePath) return false;
  return /(?:^|[\\/])index\.mdx?$/.test(filePath);
}

function hrefToSlug(href: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  let s = href;
  if (base && s.startsWith(base)) s = s.slice(base.length);
  s = s.replace(/^\/+|\/+$/g, '');
  if (s.endsWith('.html')) s = s.slice(0, -5);
  if (s === 'index') s = '';
  return s;
}

// Discover all index pages at build time via Vite glob — no astro:content needed
const indexPaths = Object.keys(
  import.meta.glob(
    ['/src/content/docs/**/index.md', '/src/content/docs/**/index.mdx'],
    { eager: false }
  )
);

const indexSlugs = new Set<string>(
  indexPaths.map((p) =>
    p.replace(/^\/src\/content\/docs\//, '').replace(/\/?index\.mdx?$/, '')
  )
);

function filterIndexPages(
  entries: SidebarEntry[],
  slugs: Set<string>
): SidebarEntry[] {
  return entries.reduce<SidebarEntry[]>((acc, entry) => {
    if (entry.type === 'link') {
      const slug = hrefToSlug(entry.href);
      if (!slugs.has(slug)) {
        acc.push(entry);
      }
    } else {
      acc.push({
        ...entry,
        entries: filterIndexPages(entry.entries, slugs),
      });
    }
    return acc;
  }, []);
}

export const onRequest = defineRouteMiddleware(async (context, next) => {
  const route = context.locals.starlightRoute;
  const entry = route.entry;

  if (isIndexPage(entry.filePath)) {
    // Unconditionally hide TOC on index pages
    route.toc = undefined;
  }

  if (indexSlugs.size > 0) {
    route.sidebar = filterIndexPages(route.sidebar, indexSlugs);
  }

  await next();
});
