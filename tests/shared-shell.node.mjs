import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { selectRelease } from '../src/shared/bootstrap.mjs';
import { ROOT, validateConsumer, validateData, validateManifest, validatePointer } from '../src/shared/contract.mjs';

const receipt = (bytes, extension) => {
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  return { url: `${ROOT}assets/${sha256}.${extension}`, sha256, bytes: Buffer.byteLength(bytes), extension };
};
function fixture(label) {
  const data = {
    menu: { items: [{ label, href: 'https://f5-sales-demo.github.io/en/ecosystem/' }] },
    searchSources: [{ repo: 'canada', label: 'Canada topology' }],
    routing: { locales: ['en', 'ar'], unlocalized: ['terraform-provider-xcsh'], englishOnly: ['canada'] },
  };
  const content = {
    css: `${label}{}`,
    runtime: `export const label=${JSON.stringify(label)}`,
    data: JSON.stringify(data),
    logo: `<svg>${label}</svg>`,
    favicon: '<svg/>',
  };
  const types = { css: 'css', runtime: 'js', data: 'json', logo: 'svg', favicon: 'svg' };
  const assets = Object.fromEntries(Object.entries(content).map(([key, bytes]) => [key, receipt(bytes, types[key])]));
  const manifest = JSON.stringify({ contract: 'v1', assets });
  const sha256 = createHash('sha256').update(manifest).digest('hex');
  const pointer = {
    contract: 'v1',
    release: { url: `${ROOT}v1/releases/${sha256}.json`, sha256, bytes: Buffer.byteLength(manifest) },
  };
  const routes = new Map([
    [pointer.release.url, manifest],
    ...Object.entries(content).map(([key, bytes]) => [assets[key].url, bytes]),
  ]);
  return { pointer, routes, assets };
}
const baseline = fixture('baseline'),
  next = fixture('next');
const store = (pointer) => ({ getItem: () => JSON.stringify(pointer), setItem() {} });
const fetcher =
  (active, options = {}) =>
  async (url, request) => {
    if (url === `${ROOT}v1/current.json`) {
      assert.equal(request.cache, 'no-store');
      if (options.outage) throw Error('outage');
      return new Response(JSON.stringify(active));
    }
    if (url === options.fail) throw Error('partial failure');
    const content = new Map([...baseline.routes, ...next.routes]).get(url);
    return new Response(url === options.corrupt ? `${content}changed` : content, { status: content ? 200 : 404 });
  };
test('validates canonical URLs, contract version, required assets and consumer mounts', () => {
  assert.equal(validatePointer(next.pointer), next.pointer);
  assert.throws(() => validatePointer({ ...next.pointer, contract: 'v2' }));
  assert.throws(() =>
    validatePointer({ ...next.pointer, release: { ...next.pointer.release, url: 'https://example.com/shared.json' } }),
  );
  const manifest = { contract: 'v1', assets: next.assets };
  validateManifest(manifest);
  assert.throws(() => validateManifest({ ...manifest, assets: { css: next.assets.css } }));
  validateConsumer({
    contract: 'v1',
    repository: 'f5-sales-demo/canada',
    documentBase: '/canada/',
    locale: 'en',
    mounts: { desktop: '#desktop', mobile: '#mobile' },
  });
  assert.throws(() => validateConsumer({ contract: 'v2' }));
});
test('switches complete active release and caches only after activation', async () => {
  let activated = false,
    cached;
  const result = await selectRelease({
    baseline: baseline.pointer,
    fetcher: fetcher(next.pointer),
    cryptoProvider: webcrypto,
    storage: {
      getItem: () => null,
      setItem(_, value) {
        assert.ok(activated);
        cached = JSON.parse(value);
      },
    },
    activate: async () => {
      activated = true;
    },
  });
  assert.equal(result.pointer.release.sha256, next.pointer.release.sha256);
  assert.deepEqual(cached, next.pointer);
});
for (const [name, options] of [
  ['outage', { outage: true }],
  ['partial CSS', { fail: next.assets.css.url }],
  ['partial runtime', { fail: next.assets.runtime.url }],
  ['hash mismatch', { corrupt: next.assets.data.url }],
  ['unsupported contract', {}],
]) {
  test(`retains cached release on ${name}`, async () => {
    const active = name === 'unsupported contract' ? { ...next.pointer, contract: 'v2' } : next.pointer;
    const result = await selectRelease({
      baseline: baseline.pointer,
      storage: store(baseline.pointer),
      fetcher: fetcher(active, options),
      cryptoProvider: webcrypto,
      activate: async () => {},
    });
    assert.equal(result.pointer.release.sha256, baseline.pointer.release.sha256);
  });
}
test('unavailable storage does not prevent loading', async () => {
  const result = await selectRelease({
    baseline: baseline.pointer,
    storage: {
      getItem() {
        throw Error();
      },
      setItem() {
        throw Error();
      },
    },
    fetcher: fetcher(next.pointer),
    cryptoProvider: webcrypto,
    activate: async () => {},
  });
  assert.equal(result.pointer.release.sha256, next.pointer.release.sha256);
});
test('activation failure tries last successful release without committing candidate', async () => {
  const attempts = [];
  const result = await selectRelease({
    baseline: baseline.pointer,
    storage: store(baseline.pointer),
    fetcher: fetcher(next.pointer),
    cryptoProvider: webcrypto,
    activate: async (release) => {
      attempts.push(release.pointer.release.sha256);
      if (attempts.length === 1) throw Error('script failure');
    },
  });
  assert.equal(result.pointer.release.sha256, baseline.pointer.release.sha256);
  assert.equal(attempts.length, 2);
});
test('complete outage leaves local documentation intact', async () => {
  let activated = false;
  const result = await selectRelease({
    baseline: baseline.pointer,
    fetcher: async () => {
      throw Error('offline');
    },
    cryptoProvider: webcrypto,
    activate: async () => {
      activated = true;
    },
  });
  assert.equal(result, null);
  assert.equal(activated, false);
});
test('rejects duplicates, non-public destinations and malformed supplied translations', () => {
  const data = {
    menu: {
      items: [
        {
          label: 'Menu',
          content: {
            categories: [
              {
                title: 'Tools',
                items: [
                  { label: 'One', href: 'https://example.com' },
                  { label: 'Two', href: 'https://example.com' },
                ],
              },
            ],
          },
        },
      ],
    },
    searchSources: [],
    routing: { locales: [], unlocalized: [], englishOnly: [] },
  };
  assert.throws(() => validateData(data));
  data.menu.items[0].content.categories[0].items.pop();
  validateData(data);
  data.menu.items[0].content.categories[0].items[0].href = 'javascript:alert(1)';
  assert.throws(() => validateData(data));
});
test('production header contains stable mounts and no menu islands or source labels', async () => {
  const header = await readFile(new URL('../components/SharedHeader.astro', import.meta.url), 'utf8');
  assert.ok(header.includes('f5-ecosystem-desktop'));
  assert.ok(header.includes('f5-ecosystem-mobile'));
  assert.ok(header.includes('Provider documentation'));
  assert.ok(!header.includes('client:'));
  assert.ok(!header.includes('data-search-sources'));
});
