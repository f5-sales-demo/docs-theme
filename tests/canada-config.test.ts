import { afterEach, describe, expect, it, vi } from 'vitest';

const captured = vi.hoisted(() => ({ starlight: vi.fn(), llms: vi.fn() }));
vi.mock('@astrojs/starlight', () => ({ default: captured.starlight }));
vi.mock('@f5-sales-demo/starlight-llms-txt', () => ({ default: captured.llms }));

import { createF5xcDocsConfig } from '../config';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
describe('Canada configuration passed to shared plugins', () => {
  it('preserves English routing and forwards favicon and LLM exclusions', () => {
    vi.stubEnv('LLMS_CONFIG', JSON.stringify({ exclude: ['_data/**'], promote: ['index'], demote: ['terraform'] }));
    const config = createF5xcDocsConfig({
      githubRepository: 'f5-sales-demo/canada',
      base: '/canada/',
    });
    expect(config.redirects).toEqual({ '/': '/canada/en/' });
    expect(captured.starlight).toHaveBeenCalledWith(
      expect.objectContaining({
        locales: { en: { label: 'English', lang: 'en' } },
        defaultLocale: 'en',
        favicon: '/assets/canada-favicon.svg',
      }),
    );
    expect(captured.llms).toHaveBeenCalledWith(
      expect.objectContaining({
        exclude: ['_data/**'],
        promote: ['index'],
        demote: ['terraform'],
        tieredHierarchy: true,
      }),
    );
    const options = captured.starlight.mock.calls[0][0];
    expect(options.head[options.head.length - 2].content).toContain('new Set(["en"])');
  });
  it('allows a caller favicon override', () => {
    createF5xcDocsConfig({ githubRepository: 'f5-sales-demo/canada', favicon: '/custom.svg' });
    expect(captured.starlight).toHaveBeenCalledWith(expect.objectContaining({ favicon: '/custom.svg' }));
  });
});
