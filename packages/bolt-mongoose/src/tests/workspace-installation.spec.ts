/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-internal-modules */
/* eslint-disable import/extensions */

import { Mongoose } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { InstallationStoreChaiTestRunner } from 'bolt-installation-store-test-kit';
import { MongooseInstallationStore } from '../index';

const debug = false;

describe('Workspace-level installation', () => {
  it('saves and finds an installation', async () => {
    const mongoose = new Mongoose({ debug });
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    try {
      const testRunner = new InstallationStoreChaiTestRunner({
        installationStore: new MongooseInstallationStore({
          mongoose,
          clientId: undefined,
          historicalDataEnabled: true,
        }),
        installationStore_ClientID_A: new MongooseInstallationStore({
          mongoose,
          clientId: '111.AAA',
          historicalDataEnabled: true,
        }),
        installationStore_ClientID_B: new MongooseInstallationStore({
          mongoose,
          clientId: '111.BBB',
          historicalDataEnabled: true,
        }),
      });
      await testRunner.runTeamLevelInstallationTestCases();
    } finally {
      await mongoose.disconnect();
      await mongod.stop();
    }
  });
  it('saves and finds an installation (historical data disabled)', async () => {
    const mongoose = new Mongoose({ debug });
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    try {
      const testRunner = new InstallationStoreChaiTestRunner({
        installationStore: new MongooseInstallationStore({
          mongoose,
          clientId: undefined,
          historicalDataEnabled: false,
        }),
        installationStore_ClientID_A: new MongooseInstallationStore({
          mongoose,
          clientId: '111.AAA',
          historicalDataEnabled: false,
        }),
        installationStore_ClientID_B: new MongooseInstallationStore({
          mongoose,
          clientId: '111.BBB',
          historicalDataEnabled: false,
        }),
      });
      await testRunner.runTeamLevelInstallationTestCases();
    } finally {
      await mongoose.disconnect();
      await mongod.stop();
    }
  });
});
