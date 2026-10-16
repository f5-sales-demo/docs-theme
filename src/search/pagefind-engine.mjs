import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const vendor = new URL('../../vendor/pagefind/', import.meta.url);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const magic = Buffer.from('pagefind_dcd');

function moduleInterface(bytes) {
  const unpacked = gunzipSync(bytes);
  if (!unpacked.subarray(0, magic.length).equals(magic)) throw new Error('Invalid Pagefind WASM envelope');
  const module = new WebAssembly.Module(unpacked.subarray(magic.length));
  return JSON.stringify({ imports: WebAssembly.Module.imports(module), exports: WebAssembly.Module.exports(module) });
}

export async function installEnglishSearchEngine(directory) {
  const root = directory instanceof URL ? fileURLToPath(directory) : directory;
  const pagefind = path.join(root, 'pagefind');
  let entry;
  try {
    entry = JSON.parse(await readFile(path.join(pagefind, 'pagefind-entry.json'), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return { applied: false };
    throw error;
  }
  if (entry.languages?.en?.wasm !== 'en') return { applied: false };
  const manifest = JSON.parse(await readFile(new URL('manifest.json', vendor), 'utf8'));
  if (entry.version !== manifest.pagefindVersion) throw new Error(`Unsupported Pagefind version ${entry.version}`);
  const replacement = await readFile(new URL('wasm.en.pagefind', vendor));
  if (sha256(replacement) !== manifest.sha256) throw new Error('Pagefind search engine integrity mismatch');
  const destination = path.join(pagefind, 'wasm.en.pagefind');
  const original = await readFile(destination);
  if (moduleInterface(original) !== moduleInterface(replacement))
    throw new Error('Pagefind search engine ABI mismatch');
  if (sha256(original) !== manifest.sha256) await writeFile(destination, replacement);
  return { applied: true, sha256: manifest.sha256, pagefindVersion: manifest.pagefindVersion };
}

export function englishSearchEngineIntegration() {
  return {
    name: 'f5-pagefind-search-matching',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const result = await installEnglishSearchEngine(dir);
        if (result.applied)
          logger.info(`English Pagefind matching engine ${result.pagefindVersion} sha256:${result.sha256}`);
      },
    },
  };
}
