import type { StarlightRouteData } from '@astrojs/starlight/route-data';
export const providerSections = [
  { label: 'Setup', path: 'provider/setup', icon: 'seti:terraform' },
  { label: 'Guides', path: 'guides', icon: 'open-book' },
  { label: 'Resources', path: 'resources', icon: 'puzzle' },
  { label: 'Data sources', path: 'data-sources', icon: 'document' },
  { label: 'Actions', path: 'actions', icon: 'rocket' },
  { label: 'Ephemeral resources', path: 'ephemeral-resources', icon: 'random' },
];

export interface ProviderPage {
  id: string;
  collection_id: string;
  parent_id: string | null;
  title: string;
  slug: string;
}

export function isCanonicalReference(data: { xcsh_docs?: { role?: string } }) {
  return !!data.xcsh_docs?.role;
}

export function collectionNavigation(pages: ProviderPage[], collection: string, base: string, current: string) {
  const active = pages.filter((page) => page.collection_id === collection);
  const ids = new Set(active.map((page) => page.id));
  const children = new Map<string | null, ProviderPage[]>();
  for (const page of active) {
    const parent = page.parent_id && ids.has(page.parent_id) ? page.parent_id : null;
    children.set(parent, [...(children.get(parent) || []), page]);
  }
  const link = (page: ProviderPage) => ({
    type: 'link' as const,
    label: page.title,
    href: `${base.replace(/\/$/, '')}/${page.slug}/`,
    isCurrent: page.slug === current,
    badge: undefined,
    attrs: {},
  });
  const tree = (page: ProviderPage, seen = new Set<string>()): StarlightRouteData['sidebar'][number] => {
    if (seen.has(page.id)) throw new Error(`Cyclic canonical navigation: ${page.id}`);
    const descendants = children.get(page.id) || [];
    // Other branches remain navigable through their reference page, whose
    // content lists every direct child. Expand only the active ancestry.
    if (!descendants.length || !(current === page.slug || current.startsWith(`${page.slug}/`))) return link(page);
    const next = new Set([...seen, page.id]);
    return {
      type: 'group',
      label: page.title,
      collapsed: !current.startsWith(page.slug),
      badge: undefined,
      entries: [link(page), ...descendants.map((child) => tree(child, next))],
    };
  };
  return (children.get(null) || []).map((page) => tree(page));
}

export function providerMegaMenu(base: string) {
  return [
    {
      label: 'Provider documentation',
      content: {
        layout: 'grid' as const,
        columns: 2 as const,
        categories: [
          {
            title: 'Terraform xcsh',
            items: providerSections.map((section) => ({
              label: section.label,
              href: `${base.replace(/\/$/, '')}/${section.path}/`,
            })),
          },
        ],
      },
    },
  ];
}
