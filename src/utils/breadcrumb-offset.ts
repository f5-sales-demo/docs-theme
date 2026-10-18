/** Account for wrapped Certificate Management breadcrumbs without changing other sites. */
let observer: ResizeObserver | undefined;

export function installCertificateBreadcrumbOffset(): void {
  observer?.disconnect();
  const root = document.documentElement;
  const breadcrumb = document.querySelector<HTMLElement>('.breadcrumbs[data-certificate-management]');
  if (!breadcrumb) {
    root.style.removeProperty('--f5-certificate-breadcrumb-height');
    return;
  }
  const measure = () =>
    root.style.setProperty('--f5-certificate-breadcrumb-height', `${breadcrumb.getBoundingClientRect().height}px`);
  measure();
  observer = new ResizeObserver(measure);
  observer.observe(breadcrumb);
  // Initial fragments can scroll before the measured offset is available.
  if (location.hash) {
    let id: string;
    try {
      id = decodeURIComponent(location.hash.slice(1));
    } catch {
      return;
    }
    const target = document.getElementById(id);
    if (target?.matches('main :is(h1, h2, h3, h4, h5, h6)')) {
      requestAnimationFrame(() => target.scrollIntoView());
    }
  }
}
