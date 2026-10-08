import { ROOT, validateConsumer, validateData, validateManifest, validatePointer } from './contract.mjs';

const CACHE_KEY = 'f5-shared-v1:last-success';
const TIMEOUT = 12000;
export async function verifiedBytes(receipt, fetcher = fetch, cryptoProvider = crypto) {
  const response = await fetcher(receipt.url, { signal: AbortSignal.timeout(TIMEOUT) });
  if (!response.ok) throw new Error(`Shared asset unavailable: ${response.status}`);
  const bytes = await response.arrayBuffer();
  const digest = Array.from(new Uint8Array(await cryptoProvider.subtle.digest('SHA-256', bytes)), (value) =>
    value.toString(16).padStart(2, '0'),
  ).join('');
  if (bytes.byteLength !== receipt.bytes || digest !== receipt.sha256)
    throw new Error('Shared asset integrity mismatch');
  return bytes;
}
export async function loadRelease(pointer, fetcher = fetch, cryptoProvider = crypto) {
  validatePointer(pointer);
  const manifest = validateManifest(
    JSON.parse(new TextDecoder().decode(await verifiedBytes(pointer.release, fetcher, cryptoProvider))),
  );
  const entries = Object.entries(manifest.assets);
  const buffers = await Promise.all(entries.map(([, asset]) => verifiedBytes(asset, fetcher, cryptoProvider)));
  const dataIndex = entries.findIndex(([key]) => key === 'data');
  const data = validateData(JSON.parse(new TextDecoder().decode(buffers[dataIndex])));
  return { pointer, manifest, data };
}
export async function selectRelease({ baseline, fetcher = fetch, storage, activate, cryptoProvider = crypto }) {
  let cached;
  try {
    cached = JSON.parse(storage?.getItem(CACHE_KEY) || 'null');
  } catch {
    /* Storage may be unavailable. */
  }
  let active;
  try {
    const response = await fetcher(`${ROOT}v1/current.json`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT),
    });
    if (!response.ok) throw new Error('Active release unavailable');
    active = validatePointer(await response.json());
  } catch {
    /* Try the previously verified release, then the build baseline. */
  }
  const attempted = new Set();
  for (const pointer of [active, cached, baseline]) {
    if (!pointer || attempted.has(pointer.release?.sha256)) continue;
    attempted.add(pointer.release?.sha256);
    try {
      const release = await loadRelease(pointer, fetcher, cryptoProvider);
      await activate(release);
      try {
        storage?.setItem(CACHE_KEY, JSON.stringify(pointer));
      } catch {
        /* Cache is optional. */
      }
      return release;
    } catch {
      /* A partial release must never replace the working shell. */
    }
  }
  return null;
}
function integrity(receipt) {
  return `sha256-${btoa(String.fromCharCode(...receipt.sha256.match(/../g).map((pair) => parseInt(pair, 16))))}`;
}
async function loadElement(element, parent) {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      element.remove();
      reject(new Error('Shared load timed out'));
    }, TIMEOUT);
    element.onload = () => {
      clearTimeout(timer);
      resolve();
    };
    element.onerror = () => {
      clearTimeout(timer);
      element.remove();
      reject(new Error('Shared load failed'));
    };
    parent.append(element);
  });
}
export async function startSharedShell(consumer, baseline) {
  validateConsumer(consumer);
  let storage;
  try {
    storage = window.localStorage;
  } catch {
    /* Browser policy can reject even property access. */
  }
  return selectRelease({
    baseline,
    storage,
    activate: async (release) => {
      const { css, runtime } = release.manifest.assets;
      const link = document.createElement('link');
      Object.assign(link, {
        rel: 'stylesheet',
        href: css.url,
        integrity: integrity(css),
        crossOrigin: 'anonymous',
        media: 'not all',
      });
      let prepared;
      try {
        await loadElement(link, document.head);
        window.F5SharedV1 ||= new Map();
        if (!window.F5SharedV1.has(runtime.url)) {
          const script = document.createElement('script');
          Object.assign(script, {
            type: 'module',
            src: runtime.url,
            integrity: integrity(runtime),
            crossOrigin: 'anonymous',
          });
          await loadElement(script, document.head);
        }
        const implementation = window.F5SharedV1.get(runtime.url);
        if (!implementation) throw new Error('Shared runtime did not register');
        prepared = implementation.prepare(consumer, release);
        prepared.commit();
        link.media = 'all';
        document.querySelector('[data-f5-baseline-css]')?.remove();
        document.documentElement.dataset.f5SharedRelease = release.pointer.release.sha256;
        document.dispatchEvent(new CustomEvent('f5:shared-ready', { detail: release.pointer }));
      } catch (error) {
        prepared?.dispose();
        link.remove();
        throw error;
      }
    },
  });
}
