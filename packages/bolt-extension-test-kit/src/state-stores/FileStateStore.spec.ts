import os from 'os';
import FileStateStore from './FileStateStore';
import { StateStoreChaiTestRunner } from './StateStoreChaiTestRunner';

const testRunner = new StateStoreChaiTestRunner({
  stateStore: new FileStateStore({
    stateSecret: 'secret',
    baseDir: os.tmpdir(),
  }),
});
testRunner.enableTests('FileStateStore');
