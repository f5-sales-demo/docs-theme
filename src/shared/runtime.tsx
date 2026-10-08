import type { MegaMenuConfig } from '@f5-sales-demo/starlight-mega-menu';
import MegaMenu from '@f5-sales-demo/starlight-mega-menu/components/MegaMenu.tsx';
import MegaMenuMobile from '@f5-sales-demo/starlight-mega-menu/components/MegaMenuMobile.tsx';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { searchSource } from '../utils/search-source.ts';

interface Consumer {
  repository: string;
  mounts: { desktop: string; mobile: string };
}
interface Asset {
  url: string;
}
interface Release {
  data: {
    menu: MegaMenuConfig;
    routing: { locales: string[]; unlocalized: string[]; englishOnly: string[] };
    searchSources: Array<{ repo: string; label: string }>;
  };
  manifest: { assets: Record<string, Asset> };
}
interface Prepared {
  commit(): void;
  dispose(): void;
}
declare global {
  interface Window {
    F5SharedV1: Map<string, { prepare(consumer: Consumer, release: Release): Prepared }>;
    F5SharedSearchV1: { mergeIndex: Array<{ bundlePath: string }> };
  }
  var F5SharedRoutingV1: Release['data']['routing'];
}
// All imports are bundled once by the publisher. No downstream React island is involved.
window.F5SharedV1 ||= new Map();
const registry = window.F5SharedV1;
registry.set(import.meta.url, {
  prepare(consumer: Consumer, release: Release) {
    const desktop = document.querySelector(consumer.mounts.desktop);
    const mobile = document.querySelector(consumer.mounts.mobile);
    if (!desktop || !mobile) throw new Error('Missing ecosystem mount');
    const desktopStage = document.createElement('div');
    const mobileStage = document.createElement('div');
    const roots = [createRoot(desktopStage), createRoot(mobileStage)];
    globalThis.F5SharedRoutingV1 = release.data.routing;
    flushSync(() => {
      roots[0].render(<MegaMenu config={release.data.menu} />);
      roots[1].render(<MegaMenuMobile config={release.data.menu} />);
    });
    let observer: MutationObserver;
    const dismissPreferences = (event: KeyboardEvent) => {
      const preferences = document.querySelector<HTMLDetailsElement>('.compact-preferences[open]');
      if (event.key === 'Escape' && preferences) {
        preferences.open = false;
        preferences.querySelector('summary')?.focus();
      }
    };
    return {
      commit() {
        desktop.replaceChildren(desktopStage);
        mobile.replaceChildren(mobileStage);
        // Branding URLs switch only with the coordinated shell release.
        for (const element of document.querySelectorAll<HTMLImageElement>('[data-f5-shared-brand]')) {
          const asset = release.manifest.assets[element.dataset.f5SharedBrand || ''];
          if (asset) element.src = asset.url;
        }
        const favicon = document.querySelector<HTMLLinkElement>('[data-f5-shared-favicon]');
        if (favicon) favicon.href = release.manifest.assets.favicon.url;
        const annotate = () => {
          for (const link of document.querySelectorAll<HTMLAnchorElement>('.pagefind-ui__result-link')) {
            const title = link.closest('.pagefind-ui__result-title');
            if (!title || title.querySelector('.search-project-source')) continue;
            const label = searchSource(link.href, release.data.searchSources);
            if (!label) continue;
            const source = document.createElement('span');
            source.className = 'search-project-source';
            source.textContent = label;
            title.append(source);
          }
        };
        observer = new MutationObserver(annotate);
        observer.observe(document.body, { childList: true, subtree: true });
        annotate();
        // Pagefind remains the local Starlight implementation. Its merge bundles are supplied here.
        const current = consumer.repository.split('/')[1];
        window.F5SharedSearchV1 = {
          mergeIndex: release.data.searchSources
            .filter((source) => source.repo !== current)
            .map((source) => ({
              bundlePath: `https://f5-sales-demo.github.io/${source.repo === 'f5-sales-demo.github.io' ? '' : `${source.repo}/`}pagefind/`,
            })),
        };
        document.addEventListener('keydown', dismissPreferences);
        // Supply the focus trap missing in the archived mobile renderer.
        document.addEventListener('keydown', trap);
      },
      dispose() {
        for (const root of roots) root.unmount();
        observer?.disconnect();
        document.removeEventListener('keydown', dismissPreferences);
        document.removeEventListener('keydown', trap);
      },
    };
  },
});
function trap(event: KeyboardEvent) {
  if (event.key !== 'Tab') return;
  const dialog = document.querySelector<HTMLElement>('.smm-mobile-overlay');
  if (!dialog) return;
  const controls = Array.from(dialog.querySelectorAll<HTMLElement>('button, a, summary, [tabindex="0"]')).filter(
    (element) => element.getClientRects().length,
  );
  const first = controls[0],
    last = controls.at(-1);
  if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
    event.preventDefault();
    first?.focus();
  }
}
