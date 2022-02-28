/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-internal-modules */
/* eslint-disable import/extensions */

import { Sequelize } from 'sequelize';
import { InstallationStoreChaiTestRunner } from 'bolt-extension-test-kit';
import { SequelizeInstallationStore } from '../index';

// Query logging
const logging: boolean = false;

describe('Org-wide installation', () => {
  it('saves and finds an installation', async () => {
    const sequelize = new Sequelize('sqlite::memory:', { logging });
    const testRunner = new InstallationStoreChaiTestRunner({
      installationStore: new SequelizeInstallationStore({
        sequelize,
        clientId: undefined,
        historicalDataEnabled: true,
      }),
      installationStore_ClientID_A: new SequelizeInstallationStore({
        sequelize,
        clientId: '111.AAA',
        historicalDataEnabled: true,
      }),
      installationStore_ClientID_B: new SequelizeInstallationStore({
        sequelize,
        clientId: '111.BBB',
        historicalDataEnabled: true,
      }),
    });
    await testRunner.runOrgWideInstallationTestCases();
  });
  it('saves and finds an installation (historical data disabled)', async () => {
    const sequelize = new Sequelize('sqlite::memory:', { logging });
    const testRunner = new InstallationStoreChaiTestRunner({
      installationStore: new SequelizeInstallationStore({
        sequelize,
        clientId: undefined,
        historicalDataEnabled: false,
      }),
      installationStore_ClientID_A: new SequelizeInstallationStore({
        sequelize,
        clientId: '111.AAA',
        historicalDataEnabled: false,
      }),
      installationStore_ClientID_B: new SequelizeInstallationStore({
        sequelize,
        clientId: '111.BBB',
        historicalDataEnabled: false,
      }),
    });
    await testRunner.runOrgWideInstallationTestCases();
  });
});
