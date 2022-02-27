/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable import/no-internal-modules */
/* eslint-disable import/extensions */

import { Prisma, PrismaClient } from '@prisma/client';
import { InstallationStoreChaiTestRunner } from 'bolt-installation-store-test-kit';
import { PrismaInstallationStore } from '../index';

const log: (Prisma.LogLevel | Prisma.LogDefinition)[] = [
  // {
  //   emit: 'stdout',
  //   level: 'query',
  // },
];

describe('Team-level installation', () => {
  it('saves and finds an installation', async () => {
    const prismaClient = new PrismaClient({ log });
    const testRunner = new InstallationStoreChaiTestRunner({
      installationStore: new PrismaInstallationStore({
        prismaTable: prismaClient.mySlackAppInstallation,
        clientId: undefined,
        historicalDataEnabled: true,
      }),
      installationStore_ClientID_A: new PrismaInstallationStore({
        prismaTable: prismaClient.mySlackAppInstallation,
        clientId: '111.AAA',
        historicalDataEnabled: true,
      }),
      installationStore_ClientID_B: new PrismaInstallationStore({
        prismaTable: prismaClient.mySlackAppInstallation,
        clientId: '111.BBB',
        historicalDataEnabled: true,
      }),
    });
    await testRunner.runTeamLevelInstallationTestCases();
  });
  it('saves and finds an installation (historical data disabled)', async () => {
    const prismaClient = new PrismaClient({ log });
    const testRunner = new InstallationStoreChaiTestRunner({
      installationStore: new PrismaInstallationStore({
        prismaTable: prismaClient.mySlackAppInstallation,
        clientId: undefined,
        historicalDataEnabled: false,
      }),
      installationStore_ClientID_A: new PrismaInstallationStore({
        prismaTable: prismaClient.mySlackAppInstallation,
        clientId: '111.AAA',
        historicalDataEnabled: false,
      }),
      installationStore_ClientID_B: new PrismaInstallationStore({
        prismaTable: prismaClient.mySlackAppInstallation,
        clientId: '111.BBB',
        historicalDataEnabled: false,
      }),
    });
    await testRunner.runTeamLevelInstallationTestCases();
  });
});
