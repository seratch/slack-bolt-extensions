/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-internal-modules */
/* eslint-disable import/extensions */

import { Connection, createConnection } from 'typeorm';
import { InstallationStoreChaiTestRunner } from 'bolt-installation-store-test-kit';
import { TypeORMInstallationStore } from '../index';
import SlackAppInstallation from '../entity/SlackAppInstallation';

describe('Team-level installation', async () => {
  let connection: Connection;

  beforeEach(() => new Promise((resolve) => {
    createConnection('team-level-tests').then((conn) => {
      connection = conn;
      resolve({});
    });
  }));

  afterEach(() => {
    connection.close(); // Promise call occassionally fails
  });

  it('saves and finds an installation', async () => {
    const testRunner = new InstallationStoreChaiTestRunner({
      installationStore: new TypeORMInstallationStore({
        connection,
        entityFactory: () => new SlackAppInstallation(),
        entityTarget: SlackAppInstallation,
        clientId: undefined,
        historicalDataEnabled: true,
      }),
      installationStore_ClientID_A: new TypeORMInstallationStore({
        connection,
        entityFactory: () => new SlackAppInstallation(),
        entityTarget: SlackAppInstallation,
        clientId: '111.AAA',
        historicalDataEnabled: true,
      }),
      installationStore_ClientID_B: new TypeORMInstallationStore({
        connection,
        entityFactory: () => new SlackAppInstallation(),
        entityTarget: SlackAppInstallation,
        clientId: '111.BBB',
        historicalDataEnabled: true,
      }),
    });
    await testRunner.runTeamLevelInstallationTestCases();
  });
  it('saves and finds an installation (historical data disabled)', async () => {
    const testRunner = new InstallationStoreChaiTestRunner({
      installationStore: new TypeORMInstallationStore({
        connection,
        entityFactory: () => new SlackAppInstallation(),
        entityTarget: SlackAppInstallation,
        clientId: undefined,
        historicalDataEnabled: false,
      }),
      installationStore_ClientID_A: new TypeORMInstallationStore({
        connection,
        entityFactory: () => new SlackAppInstallation(),
        entityTarget: SlackAppInstallation,
        clientId: '111.AAA',
        historicalDataEnabled: false,
      }),
      installationStore_ClientID_B: new TypeORMInstallationStore({
        connection,
        entityFactory: () => new SlackAppInstallation(),
        entityTarget: SlackAppInstallation,
        clientId: '111.BBB',
        historicalDataEnabled: false,
      }),
    });
    await testRunner.runTeamLevelInstallationTestCases();
  });
});
