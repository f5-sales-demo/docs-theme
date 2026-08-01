import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { sanitizePagefindAttribution } from '../scripts/sanitize-generated-output.mjs';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('sanitizePagefindAttribution', () => {
  it('removes only Pagefind translator contact fields and retains names', async () => {
    const workspace = await mkdtemp(path.join(tmpdir(), 'docs-theme-sanitize-'));
    temporaryDirectories.push(workspace);

    const distDirectory = path.join(workspace, 'dist');
    const pagefindBundle = path.join(workspace, 'ui-core.mjs');
    const generatedBundle = path.join(distDirectory, 'pagefind-ui.js');
    const unrelatedEmail = ['person', 'customer.local'].join('@');

    await mkdir(distDirectory);
    await writeFile(pagefindBundle, 'var thanks_to = "Example Translator <translator@example.com>";');
    await writeFile(generatedBundle, `Example Translator <translator@example.com>; contact=${unrelatedEmail}`);

    const result = await sanitizePagefindAttribution({ distDirectory, pagefindBundle });
    const sanitized = await readFile(generatedBundle, 'utf8');

    expect(result).toEqual({ filesChanged: 1, replacements: 1 });
    expect(sanitized).toContain('Example Translator');
    expect(sanitized).not.toContain('translator@example.com');
    expect(sanitized).toContain(unrelatedEmail);
  });
});
