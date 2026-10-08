import baseline from './baseline.json' with { type: 'json' };

export { baseline };
export function sharedMode(repository = process.env.GITHUB_REPOSITORY || '') {
  const requested = process.env.DOCS_SHARED_MODE || 'auto';
  if (!['auto', 'local', 'publish', 'consume'].includes(requested)) throw new Error('Invalid DOCS_SHARED_MODE');
  const root = repository === 'f5-sales-demo/f5-sales-demo.github.io';
  const mode =
    requested === 'auto'
      ? root
        ? 'publish'
        : repository.startsWith('f5-sales-demo/')
          ? 'consume'
          : 'local'
      : requested;
  if ((mode === 'publish') !== root && mode !== 'local')
    throw new Error('Only the landing repository publishes the shared tree');
  return mode;
}
