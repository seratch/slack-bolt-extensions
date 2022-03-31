/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-internal-modules */
/* eslint-disable import/extensions */

import { assert } from 'chai';
import AppRunner from '../AppRunner';

describe('AppRunner', () => {
  it('can be instantiated', async () => {
    const runner = new AppRunner({ signingSecret: 'secret' });
    assert.isDefined(runner);
  });
});
