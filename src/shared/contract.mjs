export const ROOT = 'https://f5-sales-demo.github.io/shared/';
export const CONTRACT = 'v1';
const hash = /^[a-f0-9]{64}$/;
export function validateAsset(asset) {
  if (!asset || !hash.test(asset.sha256) || !Number.isSafeInteger(asset.bytes) || asset.bytes < 1) {
    throw new Error('Invalid shared asset receipt');
  }
  const url = new URL(asset.url);
  if (
    url.href !== `${ROOT}assets/${asset.sha256}.${asset.extension}` ||
    !/^(css|js|json|woff2|svg|png|txt)$/.test(asset.extension)
  ) {
    throw new Error('Shared asset must use its canonical content-addressed root URL');
  }
  return asset;
}
export function validatePointer(pointer) {
  if (pointer?.contract !== CONTRACT) throw new Error('Unsupported shared contract');
  const release = pointer.release;
  if (
    !release ||
    !hash.test(release.sha256) ||
    !Number.isSafeInteger(release.bytes) ||
    release.bytes < 1 ||
    release.url !== `${ROOT}v1/releases/${release.sha256}.json`
  )
    throw new Error('Invalid shared release pointer');
  return pointer;
}
export function validateManifest(manifest) {
  if (manifest?.contract !== CONTRACT || !manifest.assets || typeof manifest.assets !== 'object')
    throw new Error('Unsupported shared manifest');
  for (const required of ['css', 'runtime', 'data', 'logo', 'favicon']) {
    if (!manifest.assets[required]) throw new Error(`Missing shared asset: ${required}`);
  }
  const types = { css: 'css', runtime: 'js', data: 'json', logo: 'svg', favicon: 'svg' };
  for (const [name, asset] of Object.entries(manifest.assets)) {
    validateAsset(asset);
    if (types[name] && asset.extension !== types[name]) throw new Error(`Incorrect shared asset type: ${name}`);
  }
  return manifest;
}
export function validateConsumer(consumer) {
  if (
    consumer?.contract !== CONTRACT ||
    !/^f5-sales-demo\/[a-z0-9_.-]+$/.test(consumer.repository) ||
    !/^\/(?:[a-zA-Z0-9_.-]+\/)*$/.test(consumer.documentBase) ||
    typeof consumer.locale !== 'string' ||
    !consumer.mounts ||
    !['desktop', 'mobile'].every(
      (key) => typeof consumer.mounts[key] === 'string' && /^#[a-z][a-z0-9-]*$/.test(consumer.mounts[key]),
    )
  ) {
    throw new Error('Invalid shared consumer contract');
  }
  return consumer;
}
export function validateData(data) {
  if (
    !Array.isArray(data?.menu?.items) ||
    !data.menu.items.length ||
    !Array.isArray(data.searchSources) ||
    !data.routing
  )
    throw new Error('Invalid shared menu data');
  const labels = new Set();
  const destinations = new Set();
  const visit = (value) => {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (key === 'href') {
        const url = new URL(child);
        if (url.protocol !== 'https:' || url.username || url.password)
          throw new Error('Menu destinations require public HTTPS URLs');
      } else if (/translations$/i.test(key)) {
        if (
          !child ||
          typeof child !== 'object' ||
          Object.values(child).some((text) => typeof text !== 'string' || !text.trim())
        )
          throw new Error('Invalid supplied translation');
      } else visit(child);
    }
  };
  visit(data.menu);
  for (const item of data.menu.items) {
    if (!item.label?.trim() || labels.has(item.label)) throw new Error('Duplicate or missing menu label');
    labels.add(item.label);
    for (const category of item.content?.categories || []) {
      const links = new Set();
      for (const link of category.items) {
        if (!link.label?.trim() || links.has(link.href)) throw new Error('Duplicate or missing menu entry');
        links.add(link.href);
        if (destinations.has(link.href)) throw new Error('Duplicate global menu destination');
        destinations.add(link.href);
      }
    }
  }
  const sources = new Set();
  for (const source of data.searchSources) {
    if (!source.repo || !source.label || sources.has(source.repo))
      throw new Error('Duplicate or missing Search source');
    sources.add(source.repo);
  }
  for (const key of ['locales', 'unlocalized', 'englishOnly']) {
    if (!Array.isArray(data.routing[key]) || data.routing[key].some((value) => typeof value !== 'string'))
      throw new Error('Invalid locale routing');
  }
  return data;
}
