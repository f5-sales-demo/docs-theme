import { expect, it } from 'vitest';
import { defaultMegaMenuItems } from '../../config';

it('leaves production menu content to the root publisher', () => expect(defaultMegaMenuItems).toEqual([]));
