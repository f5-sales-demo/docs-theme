import { describe, expect, it } from 'vitest';
import { defaultMegaMenuItems } from '../../config';
import { localizeEcosystemHref } from './localize-ecosystem-href';

describe('showcase navigation', () => {
  it('uses the audience taxonomy without duplicate project destinations', () => {
    expect(defaultMegaMenuItems.map((item) => item.label)).toEqual([
      'Demos',
      'Demo environment',
      'Operations',
      'Developer tools',
      'Ecosystem',
      'F5 services',
    ]);
    const links = defaultMegaMenuItems.flatMap((item) => item.content?.categories?.flatMap((c) => c.items) ?? []);
    const urls = links.map((item) => item.href);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).not.toContain('https://f5-sales-demo.github.io/');
    expect(links.find((l) => l.href.includes('/api-protection/'))?.label).toBe('API Protection');
    expect(links.find((l) => l.href.includes('/ddos/'))?.label).toBe('DDoS Mitigation');
    expect(defaultMegaMenuItems[1].content?.footer?.label).toBe('Demo resource catalog');
  });

  it('keeps explicit English catalog destinations valid across locale selection', () => {
    for (const locale of ['en', 'fr', 'ar']) {
      expect(localizeEcosystemHref('https://f5-sales-demo.github.io/en/demos/', locale)).toBe(
        'https://f5-sales-demo.github.io/en/demos/',
      );
      expect(localizeEcosystemHref('https://f5-sales-demo.github.io/en/ecosystem/', locale)).toBe(
        'https://f5-sales-demo.github.io/en/ecosystem/',
      );
    }
  });
});
