import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { compactProviderScopes } from './compact-scopes.mjs';

it('keeps generated scope selectors consistent across HTML CSS and JS', async () => {
  const root = await mkdtemp(join(tmpdir(), 'provider-scope-'));
  try {
    await writeFile(join(root, 'page.html'), '<div class="astro-abcdefgh">Reference</div>');
    await writeFile(join(root, 'page.css'), '.astro-abcdefgh{color:red}');
    await writeFile(join(root, 'page.js'), 'document.querySelector(".astro-abcdefgh")');
    const result = await compactProviderScopes(root);
    expect(result.aliases).toBe(1);
    expect(await readFile(join(root, 'page.html'), 'utf8')).toBe('<div class="f5p0">Reference</div>');
    expect(await readFile(join(root, 'page.css'), 'utf8')).toBe('.f5p0{color:red}');
    expect(await readFile(join(root, 'page.js'), 'utf8')).toContain('.f5p0');
    expect((await compactProviderScopes(root)).savedBytes).toBe(0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
