import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

/**
 * Starlight sidebar config types (simplified).
 */
type SidebarLink = { label: string; link: string };
type SidebarGroup = { label: string; items: SidebarItem[]; collapsed?: boolean };
type SidebarItem = SidebarLink | SidebarGroup;

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
 * Strip the provider suffix from a page_title to get a clean display title.
 * e.g. "f5xc_api_crawler Resource - volterratf5xc" → "f5xc_api_crawler"
 */
function cleanPageTitle(pageTitle: string): string {
  return pageTitle.replace(/\s+(Resource|Data Source)\s*-\s*.*$/i, '').trim();
}

/**
 * Convert a file path relative to the content dir into a Starlight link slug.
 * e.g. "resources/api_crawler.md" → "/resources/api_crawler/"
 *      "guides/getting-started.md" → "/guides/getting-started/"
 *      "index.md" → "/"
 */
function filePathToSlug(relativePath: string): string {
  const normalized = relativePath
    .replace(/\\/g, '/')
    .replace(/\.mdx?$/, '')
    .replace(/\/index$/, '');

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

  const files = collectMarkdownFiles(resolvedDir);
  const docs: DocEntry[] = [];
  let hasAnySubcategory = false;
  let hasOverview = false;

  for (const filePath of files) {
    const relativePath = path.relative(resolvedDir, filePath).replace(/\\/g, '/');
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

    // Determine title: prefer `title`, fall back to cleaned `page_title`
    let title = '';
    if (typeof frontmatter.title === 'string' && frontmatter.title.trim()) {
      title = frontmatter.title.trim();
    } else if (typeof frontmatter.page_title === 'string' && frontmatter.page_title.trim()) {
      title = cleanPageTitle(frontmatter.page_title);
    } else {
      // Last resort: derive from filename
      title = path.basename(filePath, path.extname(filePath)).replace(/[-_]/g, ' ');
    }

    const subcategory =
      typeof frontmatter.subcategory === 'string' && frontmatter.subcategory.trim()
        ? frontmatter.subcategory.trim()
        : undefined;

    if (subcategory) hasAnySubcategory = true;

    docs.push({ title, subcategory, docType, slug });
  }

  // If no files have subcategory, return undefined for auto-generation fallback
  if (!hasAnySubcategory) return undefined;

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
    sidebar.push({ label: 'Overview', link: '/' });
  }

  // 2. Guides group
  if (guides.length > 0) {
    sidebar.push({
      label: 'Guides',
      collapsed: true,
      items: guides.sort(byTitle).map((g) => ({ label: g.title, link: g.slug })),
    });
  }

  // 3. Functions group
  if (functions.length > 0) {
    sidebar.push({
      label: 'Functions',
      collapsed: true,
      items: functions.sort(byTitle).map((f) => ({ label: f.title, link: f.slug })),
    });
  }

  // 4. Subcategory groups (resources + data sources)
  const subcategoryMap = new Map<string, { resources: DocEntry[]; dataSources: DocEntry[] }>();

  for (const doc of [...resources, ...dataSources]) {
    const cat = doc.subcategory || 'Uncategorized';
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
        items: catResources.sort(byTitle).map((r) => ({ label: r.title, link: r.slug })),
      });
    }

    if (catDataSources.length > 0) {
      groupItems.push({
        label: 'Data Sources',
        items: catDataSources.sort(byTitle).map((d) => ({ label: d.title, link: d.slug })),
      });
    }

    if (groupItems.length > 0) {
      sidebar.push({
        label: category,
        collapsed: true,
        items: groupItems,
      });
    }
  }

  return sidebar;
}
