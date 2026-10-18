import { describe, expect, it } from 'vitest';
import { publicationProfiles, publicationSidebar } from '../src/utils/publication-profiles';

describe('Certificate Management workflow orientation', () => {
  it('collapses inactive groups while preserving workflow order', () => {
    const sidebar = publicationProfiles['certificate-management'].sidebar!;
    expect(sidebar.map((item) => (typeof item === 'object' && 'label' in item ? item.label : undefined))).toEqual([
      'Overview',
      'xcsh',
      'Terraform',
      'Client mTLS',
      'Wingman',
    ]);
    for (const item of sidebar.slice(1)) {
      expect(item).toHaveProperty('collapsed', true);
    }
  });
  it('preserves automatic navigation outside configured repositories', () => {
    const fallback = [{ label: 'Guides', items: [], collapsed: false }];
    expect(publicationSidebar('f5-sales-demo/xcsh', fallback)).toBe(fallback);
  });
});
