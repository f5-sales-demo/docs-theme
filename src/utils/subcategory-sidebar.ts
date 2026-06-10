import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { sidebarTranslations } from '../i18n/translations.ts';

/**
 * Starlight sidebar config types (simplified).
 */
type SidebarLink = { label: string; link: string; translations?: Record<string, string> };
type SidebarGroup = { label: string; items: SidebarItem[]; collapsed?: boolean; translations?: Record<string, string> };
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
 * Clean a page_title to match Terraform Registry sidebar labels.
 * Resources:    "f5xc_http_loadbalancer Resource - terraform-provider-f5xc" → "f5xc_http_loadbalancer"
 * Data Sources: "f5xc_http_loadbalancer Data Source - terraform-provider-f5xc" → "f5xc_http_loadbalancer"
 * Functions:    "blindfold function - terraform-provider-f5xc" → "blindfold"
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

const KNOWN_ACRONYMS = new Set(['api', 'faq', 'dns', 'cli', 'sdk', 'ui', 'ip']);

function kebabToTitleCase(kebab: string): string {
  return kebab
    .split('-')
    .map((word) => (KNOWN_ACRONYMS.has(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');
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
    const topLevelDirs: string[] = [];
    try {
      const dirEntries = fs.readdirSync(scanDir, { withFileTypes: true });
      for (const entry of dirEntries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && !entry.name.startsWith('_')) {
          topLevelDirs.push(entry.name);
        }
      }
    } catch {
      return undefined;
    }
    if (topLevelDirs.length === 0) return undefined;

    const sidebar: SidebarItem[] = [];

    if (hasOverview) {
      sidebar.push({ label: 'Overview', link: '/', translations: sidebarTranslations.Overview });
    }

    for (const dir of topLevelDirs.sort()) {
      const label = kebabToTitleCase(dir);
      const translations = sidebarTranslations[label as keyof typeof sidebarTranslations];
      const dirPath = path.join(scanDir, dir);
      const dirFiles = collectMarkdownFiles(dirPath);
      const links: SidebarLink[] = dirFiles
        .map((filePath) => {
          const relativePath = path.relative(scanDir, filePath).replace(/\\/g, '/');
          const slug = filePathToSlug(relativePath);
          const baseName = path.basename(relativePath, path.extname(relativePath));
          if (baseName === 'index') return null;
          let title = '';
          try {
            const raw = fs.readFileSync(filePath, 'utf-8');
            const parsed = matter(raw);
            if (typeof parsed.data.title === 'string' && parsed.data.title.trim()) {
              title = parsed.data.title.trim();
            }
          } catch {
            /* skip */
          }
          if (!title) {
            title = baseName.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          }
          return { label: title, link: slug } as SidebarLink;
        })
        .filter((item): item is SidebarLink => item !== null)
        .sort((a, b) => a.label.localeCompare(b.label));

      if (links.length > 0) {
        sidebar.push({
          label,
          collapsed: false,
          ...(translations ? { translations } : {}),
          items: links,
        });
      }
    }

    return sidebar;
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
      items: guides.sort(byTitle).map((g) => ({ label: g.title, link: g.slug })),
    });
  }

  // 3. Functions group
  if (functions.length > 0) {
    sidebar.push({
      label: 'Functions',
      collapsed: true,
      translations: sidebarTranslations.Functions,
      items: functions.sort(byTitle).map((f) => ({ label: f.title, link: f.slug })),
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
        items: catResources.sort(byTitle).map((r) => ({ label: r.title, link: r.slug })),
      });
    }

    if (catDataSources.length > 0) {
      groupItems.push({
        label: 'Data Sources',
        translations: sidebarTranslations['Data Sources'],
        items: catDataSources.sort(byTitle).map((d) => ({ label: d.title, link: d.slug })),
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
