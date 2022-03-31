/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-internal-modules */
/* eslint-disable import/extensions */

import { assert } from 'chai';
import FastifyReceiver from '../receivers/FastifyReceiver';

describe('FastifyReceiver', () => {
  it('can be instantiated', async () => {
    const receiver = new FastifyReceiver({
      signingSecret: 'secret',
    });
    assert.isDefined(receiver);
  });
});
