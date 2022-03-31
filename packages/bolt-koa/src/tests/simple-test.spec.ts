/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-internal-modules */
/* eslint-disable import/extensions */

import { assert } from 'chai';
import Router from '@koa/router';
import Koa from 'koa';

import KoaReceiver from '../receivers/KoaReceiver';

describe('KoaReceiver', () => {
  it('can be instantiated', async () => {
    const koa = new Koa();
    const router = new Router();
    const receiver = new KoaReceiver({
      signingSecret: 'secret',
      koa,
      router,
    });
    assert.isDefined(receiver);
  });
});
