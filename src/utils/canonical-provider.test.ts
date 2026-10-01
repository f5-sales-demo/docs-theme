import { describe, expect, it } from 'vitest';
import { collectionNavigation, isCanonicalReference, providerSections } from './canonical-provider';

describe('canonical provider navigation', () => {
  it('includes all four provider families and setup and guides', () => {
    expect(providerSections.map((s) => s.path)).toEqual([
      'provider/setup',
      'guides',
      'resources',
      'data-sources',
      'actions',
      'ephemeral-resources',
    ]);
  });
  it('retains canonical index navigation and TOC', () => {
    expect(isCanonicalReference({ xcsh_docs: { role: 'reference' } })).toBe(true);
    expect(isCanonicalReference({})).toBe(false);
  });
  it('includes only the active collection, with parent relationships', () => {
    const pages = [
      { id: 'a', collection_id: 'one', parent_id: null, title: 'One', slug: 'resources/one' },
      { id: 'b', collection_id: 'one', parent_id: 'a', title: 'Property', slug: 'resources/one/properties' },
      { id: 'c', collection_id: 'two', parent_id: null, title: 'Two', slug: 'resources/two' },
    ];
    const nav = collectionNavigation(pages, 'one', '/version/', 'resources/one/properties');
    expect(JSON.stringify(nav)).not.toContain('Two');
    expect(nav[0].entries[1].href).toBe('/version/resources/one/properties/');
    expect(nav[0].entries[1].isCurrent).toBe(true);
  });
});

describe('bounded collection expansion', () => {
  it('keeps sibling references and expands only the exact active ancestry', () => {
    const pages = [
      { id: 'root', collection_id: 'c', parent_id: null, title: 'Root', slug: 'resources/demo' },
      { id: 'a', collection_id: 'c', parent_id: 'root', title: 'A', slug: 'resources/demo/properties/a' },
      { id: 'aa', collection_id: 'c', parent_id: 'a', title: 'AA', slug: 'resources/demo/properties/a/child' },
      { id: 'b', collection_id: 'c', parent_id: 'root', title: 'B', slug: 'resources/demo/properties/ab' },
      { id: 'bb', collection_id: 'c', parent_id: 'b', title: 'BB', slug: 'resources/demo/properties/ab/child' },
    ];
    const nav = collectionNavigation(pages, 'c', '/', 'resources/demo/properties/a/child');
    const text = JSON.stringify(nav);
    expect(text).toContain('AA');
    expect(text).toContain('"label":"B"');
    expect(text).not.toContain('BB');
    expect(nav[0].type).toBe('group');
  });
});
