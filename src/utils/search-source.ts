export function searchSource(href: string, sources: Array<{ repo: string; label: string }>): string | undefined {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return undefined;
  }
  if (url.hostname !== 'f5-sales-demo.github.io') return undefined;
  const project = url.pathname.split('/').filter(Boolean)[0];
  return sources.find((source) => source.repo === project)?.label ?? 'Sales demo portal';
}
