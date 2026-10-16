import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import * as pagefind from 'pagefind';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { installEnglishSearchEngine } from './pagefind-engine.mjs';

let directory: string;
const require = createRequire(import.meta.url);
const checksum = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const unpack = (bytes: Buffer) => gunzipSync(bytes).subarray(12);

beforeAll(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), 'pagefind-matching-'));
  const { index, errors } = await pagefind.createIndex();
  expect(errors).toEqual([]);
  if (!index) throw new Error('Missing Pagefind index');
  for (const [slug, title, body] of [
    ['alias', 'Command alias', 'Search also answers to q.'],
    ['manifest', 'Manifest guide', 'Create and apply manifests with xcsh.'],
  ]) {
    const result = await index.addHTMLFile({
      sourcePath: `${slug}/index.html`,
      content: `<html lang="en"><body><main data-pagefind-body><h1>${title}</h1><p>${body}</p></main></body></html>`,
    });
    expect(result.errors).toEqual([]);
  }
  const output = await index.writeFiles({ outputPath: path.join(directory, 'pagefind') });
  expect(output.errors).toEqual([]);
  await pagefind.close();
}, 30000);

afterAll(async () => {
  await rm(directory, { recursive: true, force: true });
});

it('rejects unsupported engines before modifying their output', async () => {
  const file = path.join(directory, 'pagefind/pagefind-entry.json');
  const original = await readFile(file, 'utf8');
  const engine = await readFile(path.join(directory, 'pagefind/wasm.en.pagefind'));
  const entry = JSON.parse(original);
  entry.version = '999.0.0';
  await writeFile(file, JSON.stringify(entry));
  await expect(installEnglishSearchEngine(directory)).rejects.toThrow('Unsupported Pagefind version');
  expect(await readFile(path.join(directory, 'pagefind/wasm.en.pagefind'))).toEqual(engine);
  await writeFile(file, original);
});

it('installs the sealed compatible engine and is idempotent', async () => {
  const installed = await installEnglishSearchEngine(directory);
  expect(installed.applied).toBe(true);
  const file = path.join(directory, 'pagefind/wasm.en.pagefind');
  const first = await readFile(file);
  expect(checksum(first)).toBe(installed.sha256);
  expect(await installEnglishSearchEngine(directory)).toEqual(installed);
  expect(await readFile(file)).toEqual(first);
});

it('runs the actual WASM against a real index with strict word and forward-prefix matching', async () => {
  await installEnglishSearchEngine(directory);
  const backend = require('../../vendor/pagefind/pagefind-bindings.cjs');
  const bytes = unpack(await readFile(path.join(directory, 'pagefind/wasm.en.pagefind')));
  await backend({ module_or_path: bytes });
  const entry = JSON.parse(await readFile(path.join(directory, 'pagefind/pagefind-entry.json'), 'utf8'));
  const metadata = unpack(await readFile(path.join(directory, `pagefind/pagefind.${entry.languages.en.hash}.pf_meta`)));
  const pointer = backend.init_pagefind(metadata);
  expect(pointer).not.toBe(0);
  for (const [query, expected] of [
    ['qzxwvjknypvzrltg', 0],
    ['qzxwvjknypvzrltg manifest', 0],
    ['manifestunknownsuffix', 0],
    ['manifest', 1],
    ['manif', 1],
    ['manifests', 1],
    ['q', 1],
  ] as const) {
    for (const hash of JSON.parse(backend.request_indexes(pointer, query))) {
      const chunk = unpack(await readFile(path.join(directory, `pagefind/index/${hash}.pf_index`)));
      backend.load_index_chunk(pointer, chunk);
    }
    const result = JSON.parse(backend.search(pointer, query, query, '', '', false, false));
    expect(result.results.length, query).toBe(expected);
    expect(result.unfiltered_total, query).toBe(expected);
  }
});
