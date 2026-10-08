import { expect, it } from 'vitest';
import { pageTitle } from './page-title';

it('omits a duplicate site suffix while retaining distinct page titles', () => {
  expect(pageTitle('Sales demos', 'Sales demos', 'Sales demos | Sales demos')).toBe('Sales demos');
  expect(pageTitle('Demo catalog', 'Sales demos', 'Demo catalog | Sales demos')).toBe('Demo catalog | Sales demos');
});
