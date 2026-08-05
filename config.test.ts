import { describe, expect, it } from 'vitest';
import { defaultMegaMenuItems, federatedSearchSites } from './config';
import { f5xcDefaultLocales } from './src/i18n/locales';

describe('default ecosystem navigation', () => {
  it('consolidates developer automation under Platform', () => {
    expect(defaultMegaMenuItems.map((item) => item.label)).not.toContain('Tools');

    const platform = defaultMegaMenuItems.find((item) => item.label === 'Platform');
    const developerAutomation = platform?.content?.categories?.find(
      (category) => category.title === 'Developer Automation',
    );

    expect(developerAutomation?.items.map((item) => item.label)).toEqual([
      'Terraform Provider',
      'API Specs',
      'API Specs Enriched',
      'xcsh Manifest Automation',
      'VS Code Extension',
      'xcsh CLI',
      'xcsh Chrome Extension',
    ]);
    expect(Object.keys(developerAutomation?.translations ?? {})).toHaveLength(
      Object.keys(f5xcDefaultLocales).length - 1,
    );
  });

  it('keeps the product name stable and localizes its description', () => {
    const platform = defaultMegaMenuItems.find((item) => item.label === 'Platform');
    const action = platform?.content?.categories
      ?.flatMap((category) => category.items)
      .find((item) => item.label === 'xcsh Manifest Automation');

    expect(action?.href).toBe('https://f5-sales-demo.github.io/xcsh-action/');
    expect(action).not.toHaveProperty('translations');
    expect(Object.keys(action?.descriptionTranslations ?? {})).toHaveLength(Object.keys(f5xcDefaultLocales).length - 1);
  });

  it('retains xcsh under AI and registers the Action for federated search', () => {
    const ai = defaultMegaMenuItems.find((item) => item.label === 'AI');
    expect(ai?.content?.categories?.flatMap((category) => category.items).map((item) => item.label)).toContain('xcsh');
    expect(federatedSearchSites).toContainEqual({ repo: 'xcsh-action', label: 'xcsh Manifest Automation' });
  });
});
