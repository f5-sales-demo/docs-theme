/** Preserve legacy index behavior except for the explicitly selected repository. */
export function suppressIndexToc(repository: string, filePath: string | undefined, tableOfContents: unknown): boolean {
  if (tableOfContents === false) return true;
  return repository !== 'f5-sales-demo/certificate-management' && /(?:^|[\\/])index\.mdx?$/.test(filePath ?? '');
}
