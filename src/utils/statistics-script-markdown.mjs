import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Keep the Statistics page-action Markdown export equal to its imported script source. */
export function statisticsScriptMarkdown() {
  let root;
  return {
    name: 'statistics-script-markdown',
    hooks: {
      'astro:config:done': ({ config }) => {
        root = fileURLToPath(config.root);
      },
      'astro:build:done': async ({ dir }) => {
        await expandStatisticsScriptMarkdown(root, fileURLToPath(dir));
      },
    },
  };
}

export async function expandStatisticsScriptMarkdown(root, output) {
  const path = join(output, 'en/shell-scripts.md');
  let markdown = await readFile(path, 'utf8');
  for (const name of ['simple-stats.sh', 'get-stats.sh']) {
    const source = await readFile(join(root, 'src/content/docs/assets/scripts', name), 'utf8');
    const fence = `\x60\x60\x60bash file=../assets/scripts/${name}\n\x60\x60\x60`;
    if (!markdown.includes(fence)) throw new Error(`Missing script import in Statistics Markdown: ${name}`);
    markdown = markdown.replace(fence, () => `\x60\x60\x60bash\n${source}\x60\x60\x60`);
  }
  await writeFile(path, markdown);
}
