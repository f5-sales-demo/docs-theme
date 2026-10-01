import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { shareProviderAssets } from './share-provider-assets.mjs';

it('shares identical generated assets, preserving script order and SVG dimensions', async () => {
  const root = await mkdtemp(join(tmpdir(), 'shared-provider-'));
  try {
    const text =
      '<h1>Reference</h1><script>window.example=1;</script><svg width="16" viewBox="0 0 24 24"><path d="M1 2"/></svg><script src="keep.js"></script>';
    await writeFile(join(root, 'one.html'), text);
    await writeFile(join(root, 'two.html'), text);
    const result = await shareProviderAssets(root, '/provider/version/');
    expect(result.assets).toBe(2);
    const html = await readFile(join(root, 'one.html'), 'utf8');
    expect(html).toContain('<h1>Reference</h1>');
    expect(html).toMatch(/<script src="\/provider\/version\/_shared\/[a-f0-9]+\.js"><\/script>/);
    expect(html).toContain('<svg width="16" viewBox="0 0 24 24"><use');
    expect(html).toContain('<script src="keep.js"></script>');
    expect(await readFile(join(root, 'two.html'), 'utf8')).toBe(html);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
