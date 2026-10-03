import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

test('canonical prototype exposes current documentation without version switching', () => {
  const source = readFileSync(new URL('../../../components/ProviderReference.astro', import.meta.url), 'utf8');
  expect(source).not.toContain('provider-version');
  expect(source).not.toContain('documentation-versions.json');
  expect(source).not.toContain('preview/main/');
});
