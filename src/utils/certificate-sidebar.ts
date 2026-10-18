let menuObserver: MutationObserver | undefined;

/** Keep the current page visible after sidebar restoration or mobile menu opening. */
export function revealCertificateSidebar(root: Document = document): void {
  if (!root.querySelector('.breadcrumbs[data-certificate-management]')) return;
  const sidebar = root.getElementById('starlight__sidebar');
  const current = sidebar?.querySelector<HTMLElement>('a[aria-current=page]');
  if (!sidebar || !current) return;
  let group = current.closest<HTMLDetailsElement>('details');
  while (group) {
    group.open = true;
    group = group.parentElement?.closest<HTMLDetailsElement>('details') ?? null;
  }
  const bounds = sidebar.getBoundingClientRect();
  if (bounds.height === 0) return;
  const target = current.getBoundingClientRect();
  if (target.top < bounds.top) sidebar.scrollTop += target.top - bounds.top - 8;
  else if (target.bottom > bounds.bottom) sidebar.scrollTop += target.bottom - bounds.bottom + 8;
}

export function installCertificateSidebarOrientation(): void {
  menuObserver?.disconnect();
  if (!document.querySelector('.breadcrumbs[data-certificate-management]')) return;
  revealCertificateSidebar();
  menuObserver = new MutationObserver(() => revealCertificateSidebar());
  menuObserver.observe(document.body, { attributes: true, attributeFilter: ['data-mobile-menu-expanded'] });
}
