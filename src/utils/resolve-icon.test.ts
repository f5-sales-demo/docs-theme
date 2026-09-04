import type { MegaMenuItem, MegaMenuSvgIcon } from '@f5-sales-demo/starlight-mega-menu';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { defaultMegaMenuItems } from '../../config.ts';
import { hasExplicitColors, resolveMegaMenuIcon } from './resolve-icon.ts';

describe('resolveMegaMenuIcon', () => {
  it('preserves palette artwork and intrinsic dimensions', () => {
    expect(resolveMegaMenuIcon('hashicorp-flight:docker-color')).toMatchObject({
      width: 24,
      height: 24,
      mode: 'original',
    } satisfies Partial<MegaMenuSvgIcon>);
  });

  it('classifies monochrome artwork for currentColor rendering', () => {
    expect(resolveMegaMenuIcon('carbon:code')).toMatchObject({
      width: 32,
      height: 32,
      mode: 'currentColor',
    } satisfies Partial<MegaMenuSvgIcon>);
  });

  it('rejects missing icons', () => {
    expect(() => resolveMegaMenuIcon('carbon:not-a-real-icon')).toThrow('Icon "not-a-real-icon" not found');
  });

  it('detects only explicit palette fills', () => {
    expect(hasExplicitColors('<path fill="#e4002b"/>')).toBe(true);
    expect(hasExplicitColors('<path fill="currentColor"/><path fill="none"/>')).toBe(false);
  });

  it('keeps the default menu assignable to the upstream type without assertions', () => {
    expectTypeOf(defaultMegaMenuItems).toMatchTypeOf<MegaMenuItem[]>();
  });
});
