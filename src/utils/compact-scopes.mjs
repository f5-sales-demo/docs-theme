import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
export async function compactProviderScopes(root) {
  const files = (await readdir(root, { recursive: true })).filter((name) => /\.(html|css|js)$/.test(name));
  const names = new Set();
  for (const file of files) {
    const text = await readFile(join(root, file), 'utf8');
    for (const match of text.matchAll(/\bastro-[a-z0-9]{8}\b/g)) names.add(match[0]);
  }
  const aliases = new Map([...names].sort().map((name, index) => [name, `f5p${index.toString(36)}`]));
  let savedBytes = 0;
  for (const file of files) {
    const path = join(root, file);
    const text = await readFile(path, 'utf8');
    const compact = text.replace(/\bastro-[a-z0-9]{8}\b/g, (name) => aliases.get(name));
    savedBytes += Buffer.byteLength(text) - Buffer.byteLength(compact);
    if (text !== compact) await writeFile(path, compact);
  }
  return { aliases: aliases.size, savedBytes };
}
