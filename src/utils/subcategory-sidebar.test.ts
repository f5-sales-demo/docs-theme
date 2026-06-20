import { describe, expect, it } from 'vitest';
import { filePathToSlug } from './subcategory-sidebar';

describe('filePathToSlug', () => {
  it('lowercases capitalised path segments to match Starlight entry slugs', () => {
    // Regression: a capitalised directory (e.g. "Enhancements/") previously
    // produced a sidebar slug that matched no (lowercased) content entry,
    // failing the Starlight build with "slug does not exist".
    expect(filePathToSlug('Enhancements/healthcheck-enhancements.mdx')).toBe(
      '/enhancements/healthcheck-enhancements/',
    );
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
