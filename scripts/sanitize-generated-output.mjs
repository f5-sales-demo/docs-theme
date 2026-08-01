import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const defaultPagefindBundle = path.join(
  path.dirname(require.resolve('@pagefind/default-ui/package.json')),
  'npm_dist/mjs/ui-core.mjs',
);
const defaultDistDirectory = fileURLToPath(new URL('../dist/', import.meta.url));
const emailPattern =
  /[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+/gi;
const translatorCreditPattern = /var thanks_to\d* = "(?:\\.|[^"\r\n])*";/g;

async function* javascriptFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* javascriptFiles(entryPath);
    else if (entry.isFile() && entry.name.endsWith('.js')) yield entryPath;
  }
}

export async function sanitizePagefindAttribution({
  distDirectory = defaultDistDirectory,
  pagefindBundle = defaultPagefindBundle,
} = {}) {
  const pagefindSource = await readFile(pagefindBundle, 'utf8');
  const contactFields = new Set();

  for (const credit of pagefindSource.match(translatorCreditPattern) ?? []) {
    for (const email of credit.match(emailPattern) ?? []) contactFields.add(` <${email}>`);
  }

  let filesChanged = 0;
  let replacements = 0;

  for await (const file of javascriptFiles(distDirectory)) {
    const original = await readFile(file, 'utf8');
    let sanitized = original;

    for (const contactField of contactFields) {
      const occurrences = sanitized.split(contactField).length - 1;
      if (occurrences > 0) {
        sanitized = sanitized.replaceAll(contactField, '');
        replacements += occurrences;
      }
    }

    if (sanitized !== original) {
      await writeFile(file, sanitized);
      filesChanged += 1;
    }
  }

  return { filesChanged, replacements };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const result = await sanitizePagefindAttribution();
  console.log(`Sanitized ${result.replacements} Pagefind contact fields across ${result.filesChanged} files.`);
}
