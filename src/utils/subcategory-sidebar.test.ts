import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildSubcategorySidebar, filePathToSlug } from './subcategory-sidebar';

const workspaces: string[] = [];

afterEach(async () => {
  await Promise.all(workspaces.splice(0).map((workspace) => rm(workspace, { force: true, recursive: true })));
});

async function writeDoc(root: string, relativePath: string, title: string, order?: number): Promise<void> {
  const filePath = path.join(root, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  const sidebar = order === undefined ? '' : `sidebar:\n  order: ${order}\n`;
  await writeFile(filePath, `---\ntitle: ${title}\n${sidebar}---\n\nContent.\n`);
}

describe('filePathToSlug', () => {
  it('lowercases capitalised path segments to match Starlight entry slugs', () => {
    // Regression: a capitalised directory (e.g. "Enhancements/") previously
    // produced a sidebar slug that matched no (lowercased) content entry,
    // failing the Starlight build with "slug does not exist".
    expect(filePathToSlug('Enhancements/healthcheck-enhancements.mdx')).toBe('/enhancements/healthcheck-enhancements/');
  });

  it('leaves already-lowercase paths unchanged', () => {
    expect(filePathToSlug('resources/api_crawler.md')).toBe('/resources/api_crawler/');
    expect(filePathToSlug('guides/getting-started.md')).toBe('/guides/getting-started/');
  });

  it('maps index files to the root slug', () => {
    expect(filePathToSlug('index.md')).toBe('/');
    expect(filePathToSlug('section/index.mdx')).toBe('/section/');
  });

  it('normalises backslashes to forward slashes', () => {
    expect(filePathToSlug('Enhancements\\foo.mdx')).toBe('/enhancements/foo/');
  });
});

describe('buildSubcategorySidebar without subcategories', () => {
  it('preserves three directory levels, index landings, and sidebar order', async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), 'docs-theme-sidebar-'));
    workspaces.push(workspace);
    const contentDir = path.join(workspace, 'content');
    const docsDir = path.join(contentDir, 'en');

    await writeDoc(docsDir, 'index.mdx', 'Home', 0);
    await writeDoc(docsDir, 'reference/index.mdx', 'Reference', 1);
    await writeDoc(docsDir, 'demo/index.mdx', 'Demo', 2);
    await writeDoc(docsDir, 'demo/verify.mdx', 'Verify', 20);
    await writeDoc(docsDir, 'demo/deploy.mdx', 'Deploy', 10);
    await writeDoc(docsDir, 'demo/troubleshooting/index.mdx', 'Troubleshooting', 5);
    await writeDoc(docsDir, 'demo/troubleshooting/bgp/index.mdx', 'BGP', 1);
    await writeDoc(docsDir, 'demo/troubleshooting/bgp/routes.mdx', 'Routes', 1);

    const sidebar = buildSubcategorySidebar(contentDir);

    expect(sidebar?.[0]).toMatchObject({ label: 'Overview', link: '/' });
    expect(sidebar?.slice(1)).toEqual([
      {
        label: 'Reference',
        collapsed: true,
        translations: expect.any(Object),
        items: [{ label: 'Overview', slug: 'reference', translations: expect.any(Object) }],
      },
      {
        label: 'Demo',
        collapsed: true,
        items: [
          { label: 'Overview', slug: 'demo', translations: expect.any(Object) },
          {
            label: 'Troubleshooting',
            collapsed: true,
            translations: expect.any(Object),
            items: [
              { label: 'Overview', slug: 'demo/troubleshooting', translations: expect.any(Object) },
              {
                label: 'BGP',
                collapsed: true,
                items: [
                  { label: 'Overview', slug: 'demo/troubleshooting/bgp', translations: expect.any(Object) },
                  { slug: 'demo/troubleshooting/bgp/routes' },
                ],
              },
            ],
          },
          { slug: 'demo/deploy' },
          { slug: 'demo/verify' },
        ],
      },
    ]);
  });

  it('falls back to title ordering when sidebar order is absent', async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), 'docs-theme-sidebar-'));
    workspaces.push(workspace);
    const contentDir = path.join(workspace, 'content');

    await writeDoc(contentDir, 'guides/index.mdx', 'Guides');
    await writeDoc(contentDir, 'guides/z-last.mdx', 'Zebra');
    await writeDoc(contentDir, 'guides/a-first.mdx', 'Alpha');

    const sidebar = buildSubcategorySidebar(contentDir);

    expect(sidebar).toEqual([
      {
        label: 'Guides',
        collapsed: true,
        translations: expect.any(Object),
        items: [
          { label: 'Overview', slug: 'guides', translations: expect.any(Object) },
          { slug: 'guides/a-first' },
          { slug: 'guides/z-last' },
        ],
      },
    ]);
  });
});

describe('authored sidebar metadata', () => {
  async function fixture(docs: Record<string, string>) {
    const root = await mkdtemp(path.join(tmpdir(), 'docs-theme-metadata-'));
    workspaces.push(root);
    for (const [file, metadata] of Object.entries(docs)) {
      const destination = path.join(root, file);
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, `---\ntitle: Article title\n${metadata}\n---\nContent.\n`);
    }
    return buildSubcategorySidebar(root);
  }

  it('uses authored root and nested index labels without Overview translations', async () => {
    const sidebar = await fixture({
      'index.mdx': 'sidebar:\n  label: Home\n  order: 0',
      'plugins/index.mdx': 'sidebar:\n  label: Plugin catalog\n  order: 1',
      'plugins/tool.mdx': 'sidebar:\n  label: Review documents',
    });
    expect(sidebar).toEqual([
      { label: 'Home', link: '/' },
      {
        label: 'Plugin catalog',
        collapsed: true,
        items: [
          { label: 'Plugin catalog', slug: 'plugins' },
          { label: 'Review documents', slug: 'plugins/tool' },
        ],
      },
    ]);
  });

  it('omits hidden root and nested pages while keeping children of hidden indexes', async () => {
    const sidebar = await fixture({
      'index.mdx': 'sidebar:\n  hidden: true',
      'hidden.mdx': 'sidebar:\n  hidden: true',
      'plugins/index.mdx': 'sidebar:\n  label: Plugins\n  hidden: true',
      'plugins/hidden.mdx': 'sidebar:\n  hidden: true',
      'plugins/deep/index.mdx': 'sidebar:\n  hidden: true',
      'plugins/deep/visible.mdx': '',
      'empty/index.mdx': 'sidebar:\n  hidden: true',
    });
    expect(sidebar).toEqual([
      {
        label: 'Plugins',
        collapsed: true,
        translations: expect.any(Object),
        items: [{ label: 'Article title', collapsed: true, items: [{ slug: 'plugins/deep/visible' }] }],
      },
    ]);
  });

  it('honors explicit order and alphabetic fallback independently of filenames', async () => {
    const sidebar = await fixture({
      'index.mdx': 'sidebar:\n  label: Home\n  order: 2',
      'last.mdx': 'sidebar:\n  label: First\n  order: 1',
      'alpha.mdx': 'sidebar:\n  label: Zebra',
      'zebra.mdx': 'sidebar:\n  label: Alpha',
    });
    expect(sidebar).toEqual([
      { label: 'First', slug: 'last' },
      { label: 'Home', link: '/' },
      { label: 'Alpha', slug: 'zebra' },
      { label: 'Zebra', slug: 'alpha' },
    ]);
  });

  it('ignores blank labels and nonboolean hidden values', async () => {
    const sidebar = await fixture({
      'index.mdx': 'sidebar:\n  label: " "\n  hidden: "true"',
      'page.mdx': 'sidebar:\n  label: " "\n  hidden: false',
    });
    expect(sidebar?.[0]).toMatchObject({ label: 'Overview', link: '/', translations: expect.any(Object) });
    expect(sidebar?.[1]).toEqual({ slug: 'page' });
  });
});
