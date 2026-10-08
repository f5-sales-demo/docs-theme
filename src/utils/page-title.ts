/** Keep the framework title format except when its site suffix repeats the page. */
export function pageTitle(title: string, siteTitle: string, formattedTitle: string): string {
  return title === siteTitle ? title : formattedTitle;
}
