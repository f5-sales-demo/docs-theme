import { describe, expect, it } from 'vitest';
import { defaultMegaMenuItems, federatedSearchSites } from './config';
import packageJson from './package.json';
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

  it('uses only the renamed Multi-Cloud Networking Pages path', () => {
    const serializedMenu = JSON.stringify(defaultMegaMenuItems);

    expect(serializedMenu).toContain('https://f5-sales-demo.github.io/multi-cloud-networking/');
    expect(serializedMenu).not.toContain('https://f5-sales-demo.github.io/mcn/');
  });

  it('links the localized F5 Docs Corpus without federating its non-HTML routes', () => {
    const platform = defaultMegaMenuItems.find((item) => item.label === 'Platform');
    const documentationTools = platform?.content?.categories?.find(
      (category) => category.title === 'Documentation Tools',
    );
    const corpus = documentationTools?.items.find((item) => item.label === 'F5 Docs Corpus');

    expect(corpus?.href).toBe('https://f5-sales-demo.github.io/html-to-markdown/');
    expect(Object.keys(corpus?.translations ?? {})).toHaveLength(Object.keys(f5xcDefaultLocales).length - 1);
    expect(Object.keys(corpus?.descriptionTranslations ?? {})).toHaveLength(Object.keys(f5xcDefaultLocales).length - 1);
    expect(federatedSearchSites.some((site) => site.repo === 'html-to-markdown')).toBe(false);
  });

  it('pins the progressive corpus plugin release exactly', () => {
    expect(packageJson.dependencies['@f5-sales-demo/starlight-llms-txt']).toBe('2.1.0');
  });
});
