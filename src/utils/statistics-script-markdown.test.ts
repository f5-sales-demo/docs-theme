import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { expandStatisticsScriptMarkdown } from './statistics-script-markdown.mjs';

describe('Statistics script Markdown export', () => {
  it('expands both complete sources without interpreting replacement characters', async () => {
    const root = await mkdtemp(join(tmpdir(), 'statistics-export-'));
    try {
      await mkdir(join(root, 'src/content/docs/assets/scripts'), { recursive: true });
      await mkdir(join(root, 'output/en'), { recursive: true });
      const source = '#!/usr/bin/env bash\nprintf "%s" "$&"\n';
      for (const name of ['simple-stats.sh', 'get-stats.sh']) {
        await writeFile(join(root, 'src/content/docs/assets/scripts', name), source);
      }
      await writeFile(
        join(root, 'output/en/shell-scripts.md'),
        ['simple-stats.sh', 'get-stats.sh']
          .map((name) => `\x60\x60\x60bash file=../assets/scripts/${name}\n\x60\x60\x60`)
          .join('\n'),
      );
      await expandStatisticsScriptMarkdown(root, join(root, 'output'));
      expect(await readFile(join(root, 'output/en/shell-scripts.md'), 'utf8')).toBe(
        `\x60\x60\x60bash\n${source}\x60\x60\x60\n\x60\x60\x60bash\n${source}\x60\x60\x60`,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
