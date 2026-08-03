import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { sidebarTranslations } from '../i18n/translations.ts';

/**
 * Starlight sidebar config types (simplified).
 */
type SidebarLink = { label?: string; link?: string; slug?: string; translations?: Record<string, string> };
type SidebarGroup = { label: string; items: SidebarItem[]; collapsed?: boolean; translations?: Record<string, string> };
type SidebarItem = SidebarLink | SidebarGroup;

interface OrderedSidebarItem {
  item: SidebarItem;
  order: number | undefined;
  sortLabel: string;
  sortPath: string;
}

type DocType = 'resource' | 'data-source' | 'guide' | 'function';

interface DocEntry {
  title: string;
  subcategory: string | undefined;
  docType: DocType;
  slug: string;
}

/**
 * Detect the doc type from a file path relative to the content directory.
 * Matches the first path segment against known prefixes.
 */
function detectDocType(relativePath: string): DocType | undefined {
  const normalized = relativePath.replace(/\\/g, '/');
  if (normalized.startsWith('resources/')) return 'resource';
  if (normalized.startsWith('data-sources/')) return 'data-source';
  if (normalized.startsWith('guides/')) return 'guide';
  if (normalized.startsWith('functions/')) return 'function';
  return undefined;
}

/**
 * Recursively collect all .md and .mdx files under a directory.
 */
function collectMarkdownFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectMarkdownFiles(fullPath));
    } else if (entry.isFile() && /\.mdx?$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Clean a page_title to match Terraform Registry sidebar labels.
 * Resources:    "f5xc_http_loadbalancer Resource - terraform-provider-xcsh" → "f5xc_http_loadbalancer"
 * Data Sources: "f5xc_http_loadbalancer Data Source - terraform-provider-xcsh" → "f5xc_http_loadbalancer"
 * Functions:    "blindfold function - terraform-provider-xcsh" → "blindfold"
 * Guides:       "Guide: HTTP Load Balancer with Security Features" → "HTTP Load Balancer with Security Features"
 */
function cleanPageTitle(pageTitle: string, docType: DocType): string {
  if (docType === 'guide') {
    return pageTitle.replace(/^Guide:\s*/i, '').trim();
  }
  if (docType === 'function') {
    return pageTitle.replace(/\s+function\s*-\s*.*$/i, '').trim();
  }
  return pageTitle.replace(/\s+(Resource|Data Source)\s*-\s*.*$/i, '').trim();
}

const KNOWN_ACRONYMS = new Set(['api', 'faq', 'dns', 'cli', 'sdk', 'ui', 'ip', 'mcp', 'tui']);

function kebabToTitleCase(kebab: string): string {
  return kebab
    .split('-')
    .map((word) => (KNOWN_ACRONYMS.has(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');
}

function readNavigationMetadata(filePath: string, fallbackTitle: string): { title: string; order: number | undefined } {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const frontmatter = matter(raw).data as Record<string, unknown>;
    const title =
      typeof frontmatter.title === 'string' && frontmatter.title.trim()
        ? frontmatter.title.trim()
        : typeof frontmatter.page_title === 'string' && frontmatter.page_title.trim()
          ? frontmatter.page_title.trim()
          : fallbackTitle;
    const sidebar = frontmatter.sidebar;
    const order =
      typeof sidebar === 'object' &&
      sidebar !== null &&
      'order' in sidebar &&
      typeof sidebar.order === 'number' &&
      Number.isFinite(sidebar.order)
        ? sidebar.order
        : undefined;
    return { title, order };
  } catch {
    return { title: fallbackTitle, order: undefined };
  }
}

function compareOrderedSidebarItems(a: OrderedSidebarItem, b: OrderedSidebarItem): number {
  const orderDifference = (a.order ?? Number.POSITIVE_INFINITY) - (b.order ?? Number.POSITIVE_INFINITY);
  if (orderDifference !== 0) return orderDifference;
  const labelDifference = a.sortLabel.localeCompare(b.sortLabel);
  return labelDifference !== 0 ? labelDifference : a.sortPath.localeCompare(b.sortPath);
}

function buildDirectorySidebar(dirPath: string, scanDir: string): OrderedSidebarItem | undefined {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return undefined;
  }

  const relativeDir = path.relative(scanDir, dirPath).replace(/\\/g, '/');
  const directoryName = path.basename(dirPath);
  const fallbackLabel = kebabToTitleCase(directoryName);
  const indexEntry = entries.find((entry) => entry.isFile() && /^index\.mdx?$/.test(entry.name));
  const indexPath = indexEntry ? path.join(dirPath, indexEntry.name) : undefined;
  const metadata = indexPath
    ? readNavigationMetadata(indexPath, fallbackLabel)
    : { title: fallbackLabel, order: undefined };
  const children: OrderedSidebarItem[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      const group = buildDirectorySidebar(fullPath, scanDir);
      if (group) children.push(group);
      continue;
    }
    if (!entry.isFile() || !/\.mdx?$/.test(entry.name) || /^index\.mdx?$/.test(entry.name)) continue;

    const relativePath = path.relative(scanDir, fullPath).replace(/\\/g, '/');
    const slug = filePathToSlug(relativePath).replace(/^\/|\/$/g, '');
    const fallbackTitle = path.basename(entry.name, path.extname(entry.name)).replace(/[-_]/g, ' ');
    const page = readNavigationMetadata(fullPath, fallbackTitle);
    children.push({
      item: { slug },
      order: page.order,
      sortLabel: page.title,
      sortPath: relativePath,
    });
  }

  children.sort(compareOrderedSidebarItems);
  const items: SidebarItem[] = [];
  if (indexPath) {
    items.push({
      label: 'Overview',
      slug: filePathToSlug(path.relative(scanDir, indexPath)).replace(/^\/|\/$/g, ''),
      translations: sidebarTranslations.Overview,
    });
  }
  items.push(...children.map((child) => child.item));
  if (items.length === 0) return undefined;

  const translations = sidebarTranslations[metadata.title as keyof typeof sidebarTranslations];
  return {
    item: {
      label: metadata.title,
      collapsed: true,
      ...(translations ? { translations } : {}),
      items,
    },
    order: metadata.order,
    sortLabel: metadata.title,
    sortPath: relativeDir,
  };
}

/**
 * Convert a file path relative to the content dir into a Starlight link slug.
 * e.g. "resources/api_crawler.md" → "/resources/api_crawler/"
 *      "guides/getting-started.md" → "/guides/getting-started/"
 *      "index.md" → "/"
 */
export function filePathToSlug(relativePath: string): string {
  const normalized = relativePath
    .replace(/\\/g, '/')
    .replace(/\.mdx?$/, '')
    .replace(/\/index$/, '')
    // Starlight lowercases content-entry slugs, so the sidebar slug must be
    // lowercased too — otherwise a capitalised path segment (e.g. "Enhancements/")
    // produces a sidebar slug that matches no entry and fails the build.
    .toLowerCase();

  if (normalized === 'index' || normalized === '') return '/';
  return `/${normalized}/`;
}

/**
 * Scan the content directory for .md/.mdx files, parse frontmatter,
 * and build a Starlight sidebar config grouped by subcategory.
 *
 * Returns `undefined` if no files contain a `subcategory` field,
 * letting Starlight fall back to directory-based auto-generation.
 */
export function buildSubcategorySidebar(contentDir: string): SidebarItem[] | undefined {
  const resolvedDir = path.resolve(contentDir);
  if (!fs.existsSync(resolvedDir)) {
    console.warn(`[subcategory-sidebar] Content directory not found: ${resolvedDir}`);
    return undefined;
  }

  // If an "en" subdirectory exists, scan it instead (locale-aware content structure)
  const enDir = path.join(resolvedDir, 'en');
  const scanDir = fs.existsSync(enDir) ? enDir : resolvedDir;

  const files = collectMarkdownFiles(scanDir);
  const docs: DocEntry[] = [];
  let hasAnySubcategory = false;
  let hasOverview = false;

  for (const filePath of files) {
    const relativePath = path.relative(scanDir, filePath).replace(/\\/g, '/');
    const slug = filePathToSlug(relativePath);

    // Track overview page separately
    if (slug === '/') {
      hasOverview = true;
      continue;
    }

    // Skip index pages — they serve as section headers, not content
    const baseName = path.basename(relativePath, path.extname(relativePath));
    if (baseName === 'index') continue;

    const docType = detectDocType(relativePath);
    if (!docType) continue; // skip files not in a recognized directory

    let frontmatter: Record<string, unknown>;
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = matter(raw);
      frontmatter = parsed.data;
    } catch {
      continue; // skip unparseable files
    }

    // Determine title from page_title (or title after entrypoint.sh renames it),
    // then clean it to match Terraform Registry sidebar label format.
    let title = '';
    if (typeof frontmatter.title === 'string' && frontmatter.title.trim()) {
      title = frontmatter.title.trim();
    } else if (typeof frontmatter.page_title === 'string' && frontmatter.page_title.trim()) {
      title = frontmatter.page_title.trim();
    } else {
      title = path.basename(filePath, path.extname(filePath)).replace(/[-_]/g, ' ');
    }
    title = cleanPageTitle(title, docType);

    const subcategory =
      typeof frontmatter.subcategory === 'string' && frontmatter.subcategory.trim()
        ? frontmatter.subcategory.trim()
        : undefined;

    if (subcategory) hasAnySubcategory = true;

    docs.push({ title, subcategory, docType, slug });
  }

  // If no files have subcategory, generate autogenerate entries with translations
  if (!hasAnySubcategory) {
    let rootEntries: fs.Dirent[];
    try {
      rootEntries = fs.readdirSync(scanDir, { withFileTypes: true });
    } catch {
      return undefined;
    }
    const orderedItems: OrderedSidebarItem[] = [];

    for (const entry of rootEntries) {
      if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
      const fullPath = path.join(scanDir, entry.name);

      if (entry.isDirectory()) {
        const group = buildDirectorySidebar(fullPath, scanDir);
        if (group) orderedItems.push(group);
        continue;
      }
      if (!entry.isFile() || !/\.mdx?$/.test(entry.name) || /^index\.mdx?$/.test(entry.name)) continue;

      const slug = filePathToSlug(entry.name).replace(/^\/|\/$/g, '');
      const fallbackTitle = path.basename(entry.name, path.extname(entry.name)).replace(/[-_]/g, ' ');
      const page = readNavigationMetadata(fullPath, fallbackTitle);
      orderedItems.push({ item: { slug }, order: page.order, sortLabel: page.title, sortPath: entry.name });
    }

    if (hasOverview) {
      const overviewEntry = rootEntries.find((entry) => entry.isFile() && /^index\.mdx?$/.test(entry.name));
      const overview = overviewEntry
        ? readNavigationMetadata(path.join(scanDir, overviewEntry.name), 'Overview')
        : { title: 'Overview', order: undefined };
      orderedItems.push({
        item: { label: 'Overview', link: '/', translations: sidebarTranslations.Overview },
        order: overview.order ?? Number.NEGATIVE_INFINITY,
        sortLabel: overview.title,
        sortPath: '',
      });
    }

    orderedItems.sort(compareOrderedSidebarItems);
    return orderedItems.length > 0 ? orderedItems.map((entry) => entry.item) : undefined;
  }

  // Partition docs by type
  const guides = docs.filter((d) => d.docType === 'guide');
  const functions = docs.filter((d) => d.docType === 'function');
  const resources = docs.filter((d) => d.docType === 'resource');
  const dataSources = docs.filter((d) => d.docType === 'data-source');

  // Alphabetical sort helper
  const byTitle = (a: DocEntry, b: DocEntry) => a.title.localeCompare(b.title);

  // Build sidebar
  const sidebar: SidebarItem[] = [];

  // 1. Overview link
  if (hasOverview) {
    sidebar.push({ label: 'Overview', link: '/', translations: sidebarTranslations.Overview });
  }

  // 2. Guides group
  if (guides.length > 0) {
    sidebar.push({
      label: 'Guides',
      collapsed: true,
      translations: sidebarTranslations.Guides,
      items: guides.sort(byTitle).map((g) => ({ slug: g.slug.replace(/^\/|\/$/g, '') })),
    });
  }

  // 3. Functions group
  if (functions.length > 0) {
    sidebar.push({
      label: 'Functions',
      collapsed: true,
      translations: sidebarTranslations.Functions,
      items: functions.sort(byTitle).map((f) => ({ slug: f.slug.replace(/^\/|\/$/g, '') })),
    });
  }

  // 4. Subcategory groups (resources + data sources)
  const subcategoryMap = new Map<string, { resources: DocEntry[]; dataSources: DocEntry[] }>();

  for (const doc of [...resources, ...dataSources]) {
    const cat = doc.subcategory ?? 'Uncategorized';
    let bucket = subcategoryMap.get(cat);
    if (!bucket) {
      bucket = { resources: [], dataSources: [] };
      subcategoryMap.set(cat, bucket);
    }
    if (doc.docType === 'resource') {
      bucket.resources.push(doc);
    } else {
      bucket.dataSources.push(doc);
    }
  }

  // Sort subcategories alphabetically, but push "Uncategorized" to the end
  const sortedCategories = [...subcategoryMap.keys()].sort((a, b) => {
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
  });

  for (const category of sortedCategories) {
    const entry = subcategoryMap.get(category);
    if (!entry) continue;
    const { resources: catResources, dataSources: catDataSources } = entry;
    const groupItems: SidebarItem[] = [];

    if (catResources.length > 0) {
      groupItems.push({
        label: 'Resources',
        translations: sidebarTranslations.Resources,
        items: catResources.sort(byTitle).map((r) => ({ slug: r.slug.replace(/^\/|\/$/g, '') })),
      });
    }

    if (catDataSources.length > 0) {
      groupItems.push({
        label: 'Data Sources',
        translations: sidebarTranslations['Data Sources'],
        items: catDataSources.sort(byTitle).map((d) => ({ slug: d.slug.replace(/^\/|\/$/g, '') })),
      });
    }

    if (groupItems.length > 0) {
      sidebar.push({
        label: category,
        collapsed: true,
        ...(sidebarTranslations[category as keyof typeof sidebarTranslations]
          ? { translations: sidebarTranslations[category as keyof typeof sidebarTranslations] }
          : {}),
        items: groupItems,
      });
    }
  }

  return sidebar;
}
