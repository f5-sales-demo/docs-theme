import { describe, expect, it, vi } from 'vitest';
import { revealCertificateSidebar } from '../src/utils/certificate-sidebar';

function fixture(top: number, bottom: number) {
  const outer = { open: false, parentElement: null };
  const inner = { open: false, parentElement: { closest: () => outer } };
  const current = { closest: () => inner, getBoundingClientRect: () => ({ top, bottom }) };
  const sidebar = {
    scrollTop: 100,
    querySelector: () => current,
    getBoundingClientRect: () => ({ top: 64, bottom: 844, height: 780 }),
  };
  const root = { querySelector: vi.fn(() => ({})), getElementById: () => sidebar } as unknown as Document;
  return { root, inner, outer, sidebar };
}

describe('Current Certificate sidebar orientation', () => {
  it('reopens current ancestors and reveals a link below the mobile viewport', () => {
    const state = fixture(994, 1026);
    revealCertificateSidebar(state.root);
    expect(state.inner.open).toBe(true);
    expect(state.outer.open).toBe(true);
    expect(state.sidebar.scrollTop).toBe(290);
  });
  it('reveals a link above restored scroll position', () => {
    const state = fixture(32, 64);
    revealCertificateSidebar(state.root);
    expect(state.sidebar.scrollTop).toBe(60);
  });
  it('leaves visible links and other repositories unchanged', () => {
    const state = fixture(100, 132);
    revealCertificateSidebar(state.root);
    expect(state.sidebar.scrollTop).toBe(100);
    const other = fixture(994, 1026);
    vi.mocked(other.root.querySelector).mockReturnValue(null);
    revealCertificateSidebar(other.root);
    expect(other.sidebar.scrollTop).toBe(100);
    expect(other.inner.open).toBe(false);
  });
});
