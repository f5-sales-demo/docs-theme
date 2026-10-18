import { describe, expect, it } from 'vitest';
import { suppressIndexToc } from '../src/utils/index-toc.ts';

describe('repository index TOC policy', () => {
  it('keeps Certificate Management overview and reference TOCs', () => {
    for (const path of ['en/index.md', 'en/terraform/index.md', 'en/terraform/certificate-surfaces/index.md']) {
      expect(suppressIndexToc('f5-sales-demo/certificate-management', path, undefined)).toBe(false);
    }
  });
  it('respects explicit opt out on every page', () => {
    expect(suppressIndexToc('f5-sales-demo/certificate-management', 'en/index.md', false)).toBe(true);
    expect(suppressIndexToc('f5-sales-demo/certificate-management', 'en/terraform/configuration.md', false)).toBe(true);
  });
  it('preserves other repositories and normal content pages', () => {
    expect(suppressIndexToc('f5-sales-demo/xcsh', 'en/index.md', undefined)).toBe(true);
    expect(suppressIndexToc('other/certificate-management', 'en/index.md', undefined)).toBe(true);
    expect(suppressIndexToc('f5-sales-demo/xcsh', 'en/guide.md', undefined)).toBe(false);
    expect(suppressIndexToc('', undefined, undefined)).toBe(false);
  });
});
