import { expect, it } from 'vitest';
import { searchSource } from './search-source';

it('identifies the source project of federated results and root catalog pages', () => {
  const sources = [{ repo: 'origin-server', label: 'Origin server' }];
  expect(searchSource('https://f5-sales-demo.github.io/origin-server/en/03-deploy/', sources)).toBe('Origin server');
  expect(searchSource('https://f5-sales-demo.github.io/en/demos/', sources)).toBe('Sales demo portal');
  expect(searchSource('https://example.com/docs/', sources)).toBeUndefined();
});
