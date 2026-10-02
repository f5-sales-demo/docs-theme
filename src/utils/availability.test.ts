import { expect, it } from 'vitest';
import { availableProviderSections } from './canonical-provider';

it('omits missing historical setup while retaining existing type families', () => {
  const paths = [
    'documentation/resources/demo/index.md',
    'documentation/data-sources/demo/index.md',
    'documentation/actions/demo/index.md',
    'documentation/ephemeral-resources/demo/index.md',
    'documentation/guides/example/index.md',
  ];
  expect(availableProviderSections(paths).map((section) => section.path)).toEqual([
    'guides',
    'resources',
    'data-sources',
    'actions',
    'ephemeral-resources',
  ]);
  expect(availableProviderSections([...paths, 'documentation/provider/setup/index.md'])[0].path).toBe('provider/setup');
});
it('does not infer setup from a different provider page or an unrelated folder', () => {
  expect(
    availableProviderSections(['documentation/provider/index.md', 'documentation/resources-other/example.md']),
  ).toEqual([]);
});
