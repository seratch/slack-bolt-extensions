/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-internal-modules */
/* eslint-disable import/extensions */

import os from 'os';
import { FileInstallationStore } from './FileInstallationStore';
import { InstallationStoreChaiTestRunner } from './InstallationStoreChaiTestRunner';

const tmpDir = os.tmpdir();
// const tmpDir = './tmp';

describe('Org-wide installation', () => {
  it('saves and finds an installation', async () => {
    const testRunner = new InstallationStoreChaiTestRunner({
      installationStore: new FileInstallationStore({
        baseDir: tmpDir,
        clientId: undefined,
        historicalDataEnabled: true,
      }),
      installationStore_ClientID_A: new FileInstallationStore({
        baseDir: tmpDir,
        clientId: '111.AAA',
        historicalDataEnabled: true,
      }),
      installationStore_ClientID_B: new FileInstallationStore({
        baseDir: tmpDir,
        clientId: '111.BBB',
        historicalDataEnabled: true,
      }),
    });
    await testRunner.runOrgWideInstallationTestCases();
  });
  it('saves and finds an installation (historical data disabled)', async () => {
    const testRunner = new InstallationStoreChaiTestRunner({
      installationStore: new FileInstallationStore({
        baseDir: tmpDir,
        clientId: undefined,
        historicalDataEnabled: false,
      }),
      installationStore_ClientID_A: new FileInstallationStore({
        baseDir: tmpDir,
        clientId: '111.AAA',
        historicalDataEnabled: false,
      }),
      installationStore_ClientID_B: new FileInstallationStore({
        baseDir: tmpDir,
        clientId: '111.BBB',
        historicalDataEnabled: false,
      }),
    });
    await testRunner.runOrgWideInstallationTestCases();
  });
});
