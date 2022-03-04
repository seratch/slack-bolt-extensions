import { ClearStateStore } from '@slack/oauth';
import { StateStoreChaiTestRunner } from './StateStoreChaiTestRunner';

const testRunner = new StateStoreChaiTestRunner({
  stateStore: new ClearStateStore('secret'),
  shouldVerifyOnlyOnce: false,
});
testRunner.enableTests('ClearStateStore');
