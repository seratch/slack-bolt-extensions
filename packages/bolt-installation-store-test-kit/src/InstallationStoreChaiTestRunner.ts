/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/naming-convention */
import { Logger } from '@slack/logger';
import { Installation, InstallationStore } from '@slack/oauth';
import { assert } from 'chai';
import { noopLogger } from './noopLogger';
import {
  DefaultTestInstallationDataProvider,
  TestInstallationDataProvider,
} from './TestInstallationDataProvider';

export interface InstallationStoreChaiTestRunnerArgs {
  installationStore: InstallationStore;
  installationStore_ClientID_A: InstallationStore;
  installationStore_ClientID_B: InstallationStore;
  testInstallatioDataProvider?: TestInstallationDataProvider;
  logger?: Logger;
}

function verifyFetchedBotInstallationIsLatestOne(
  installation: Installation<'v1' | 'v2'>,
  expiresAt: number,
) {
  assert.isNotNull(installation);
  assert.equal(installation?.appId, 'test-app-id');
  assert.equal(installation?.bot?.token, 'xoxb-XXX');
  assert.equal(installation?.bot?.refreshToken, 'xoxe-1-XXX');
  assert.equal(installation?.bot?.expiresAt, expiresAt);
}

function verifyFetchedUserInstallationIsLatestOne(
  installation: Installation<'v1' | 'v2'>,
  expiresAt: number,
) {
  assert.isNotNull(installation);
  assert.equal(installation?.appId, 'test-app-id');
  assert.equal(installation?.user.token, 'xoxp-YYY');
  assert.equal(installation?.user.refreshToken, 'xoxe-1-YYY');
  assert.equal(installation?.user.expiresAt, expiresAt);
}

export class InstallationStoreChaiTestRunner {
  private installationStore: InstallationStore;

  private installationStore_ClientID_A: InstallationStore;

  private installationStore_ClientID_B: InstallationStore;

  private testInstallatioDataProvider: TestInstallationDataProvider;

  private logger: Logger;

  public constructor(args: InstallationStoreChaiTestRunnerArgs) {
    this.installationStore = args.installationStore;
    this.installationStore_ClientID_A = args.installationStore_ClientID_A;
    this.installationStore_ClientID_B = args.installationStore_ClientID_B;
    this.installationStore = args.installationStore;
    this.testInstallatioDataProvider = args.testInstallatioDataProvider !== undefined ?
      args.testInstallatioDataProvider :
      new DefaultTestInstallationDataProvider();
    this.logger = args.logger !== undefined ? args.logger : noopLogger;
  }

  public async runOrgWideInstallationTestCases(): Promise<void> {
    // --------------------------------------------------
    // Create a few installations
    // - two installations by user 1
    // - one installation by user 2

    try {
      const tokenExpiresAt = Math.floor(new Date().getTime() / 1000);
      const inputInstallation = this.testInstallatioDataProvider.buildOrgWideInstallation(tokenExpiresAt);
      try {
        await this.installationStore.storeInstallation(
          inputInstallation,
          this.logger,
        );
        // Latest user installation associated with user 1
        const userLatest: Installation = JSON.parse(
          JSON.stringify(inputInstallation),
        );
        if (userLatest.bot) {
          userLatest.user.token = 'xoxp-YYY';
          userLatest.user.refreshToken = 'xoxe-1-YYY';
        } else {
          assert.fail('the test data is invalid');
        }
        await this.installationStore.storeInstallation(userLatest, this.logger);

        // Latest bot installation associated with user 2
        const botLatest: Installation = JSON.parse(
          JSON.stringify(inputInstallation),
        );
        botLatest.user.id = 'test-user-id-2';
        if (botLatest.bot) {
          botLatest.bot.token = 'xoxb-XXX';
          botLatest.bot.refreshToken = 'xoxe-1-XXX';
          delete botLatest.user.token;
          delete botLatest.user.refreshToken;
          delete botLatest.user.scopes;
          delete botLatest.user.expiresAt;
        } else {
          assert.fail('the test data is invalid');
        }
        await this.installationStore.storeInstallation(botLatest, this.logger);

        // fetchInstallation tests
        const user1Query = {
          enterpriseId: 'test-enterprise-id',
          teamId: undefined,
          userId: 'test-user-id-1',
          isEnterpriseInstall: true,
        };
        let userInstallation = await this.installationStore.fetchInstallation(
          user1Query,
          this.logger,
        );
        // User 1's user token
        verifyFetchedUserInstallationIsLatestOne(
          userInstallation,
          tokenExpiresAt,
        );
        // The latest bot token from user 2
        verifyFetchedBotInstallationIsLatestOne(
          userInstallation,
          tokenExpiresAt,
        );

        const botQuery = {
          enterpriseId: 'test-enterprise-id',
          teamId: undefined,
          isEnterpriseInstall: true,
        };
        let botInstallation = await this.installationStore.fetchInstallation(
          botQuery,
          this.logger,
        );
        // The latest bot token from user 2
        verifyFetchedBotInstallationIsLatestOne(
          botInstallation,
          tokenExpiresAt,
        );

        if (this.installationStore.deleteInstallation !== undefined) {
          await this.installationStore.deleteInstallation(
            user1Query,
            this.logger,
          );
          userInstallation = await this.installationStore.fetchInstallation(
            user1Query,
            this.logger,
          );
          // userToken no longer exists but bot data should be still alive
          assert.notExists(userInstallation.user.token);
          // The latest bot token from user 2
          verifyFetchedBotInstallationIsLatestOne(
            userInstallation,
            tokenExpiresAt,
          );

          botInstallation = await this.installationStore.fetchInstallation(
            botQuery,
            this.logger,
          );
          // The latest bot token from user 2
          verifyFetchedBotInstallationIsLatestOne(
            botInstallation,
            tokenExpiresAt,
          );

          await this.installationStore.deleteInstallation(botQuery, this.logger);

          try {
            await this.installationStore.fetchInstallation(botQuery, this.logger);
            assert.fail('Exception should be thrown here');
          } catch (e: any) {
            assert.equal(
              e.message,
              'No installation data found (enterprise_id: test-enterprise-id, team_id: undefined, user_id: undefined)',
            );
          }
        }

        // Managing multiple Slack apps in a single database table
        // A different app A stores a token with user 2
        const appABotInstallation: Installation = JSON.parse(
          JSON.stringify(inputInstallation),
        );
        appABotInstallation.user.id = 'test-user-id-2';
        if (appABotInstallation.bot) {
          appABotInstallation.bot.token = 'xoxb-XXX';
          appABotInstallation.bot.refreshToken = 'xoxe-1-XXX';
        } else {
          assert.fail('the test data is invalid');
        }
        await this.installationStore_ClientID_A.storeInstallation(
          appABotInstallation,
          this.logger,
        );

        // App A should find the installation
        const shouldBeFoundBot = await this.installationStore_ClientID_A.fetchInstallation(
          botQuery,
          this.logger,
        );
        assert.isNotNull(shouldBeFoundBot);
        const appAUserInstallation: Installation = JSON.parse(
          JSON.stringify(inputInstallation),
        );
        await this.installationStore_ClientID_A.storeInstallation(
          appAUserInstallation,
          this.logger,
        );
        const shouldBeFoundUser = await this.installationStore_ClientID_A.fetchInstallation(
          user1Query,
          this.logger,
        );
        assert.isNotNull(shouldBeFoundUser);

        // If an installation store is not client_id wired,
        // the above app A data should not be returned.
        try {
          await this.installationStore.fetchInstallation(botQuery, this.logger);
          assert.fail('Exception should be thrown here');
        } catch (e: any) {
          assert.equal(
            e.message,
            'No installation data found (enterprise_id: test-enterprise-id, team_id: undefined, user_id: undefined)',
          );
        }
        try {
          await this.installationStore.fetchInstallation(user1Query, this.logger);
          assert.fail('Exception should be thrown here');
        } catch (e: any) {
          assert.equal(
            e.message,
            'No installation data found (enterprise_id: test-enterprise-id, team_id: undefined, user_id: test-user-id-1)',
          );
        }

        // The installation store for a different app should not be able to accees
        // app A's installation data even for the same workspace.
        try {
          await this.installationStore_ClientID_B.fetchInstallation(
            botQuery,
            this.logger,
          );
          assert.fail('Exception should be thrown here');
        } catch (e: any) {
          assert.equal(
            e.message,
            'No installation data found (enterprise_id: test-enterprise-id, team_id: undefined, user_id: undefined)',
          );
        }
        try {
          await this.installationStore_ClientID_B.fetchInstallation(
            user1Query,
            this.logger,
          );
          assert.fail('Exception should be thrown here');
        } catch (e: any) {
          assert.equal(
            e.message,
            'No installation data found (enterprise_id: test-enterprise-id, team_id: undefined, user_id: test-user-id-1)',
          );
        }
      } finally {
        [
          this.installationStore,
          this.installationStore_ClientID_A,
          this.installationStore_ClientID_B,
        ].forEach(async (s) => {
          if (typeof (s as any).close === 'function') {
            await (s as any).close();
          }
        });
      }
    } catch (e) {
      console.trace(e);
      throw e;
    }
  }

  public async runTeamLevelInstallationTestCases(): Promise<void> {
    // --------------------------------------------------
    // Create a few installations
    // - two installations by user 1
    // - one installation by user 2

    const tokenExpiresAt = Math.floor(new Date().getTime() / 1000);
    const inputInstallation = this.testInstallatioDataProvider.buildTeamInstallation(tokenExpiresAt);
    try {
      try {
        await this.installationStore.storeInstallation(
          inputInstallation,
          this.logger,
        );
        // Latest user installation associated with user 1
        const userLatest: Installation = JSON.parse(
          JSON.stringify(inputInstallation),
        );
        if (userLatest.bot) {
          userLatest.user.token = 'xoxp-YYY';
          userLatest.user.refreshToken = 'xoxe-1-YYY';
        } else {
          assert.fail('the test data is invalid');
        }
        await this.installationStore.storeInstallation(userLatest, this.logger);

        // Latest bot installation associated with user 2
        const botLatest: Installation = JSON.parse(
          JSON.stringify(inputInstallation),
        );
        botLatest.user.id = 'test-user-id-2';
        if (botLatest.bot) {
          botLatest.bot.token = 'xoxb-XXX';
          botLatest.bot.refreshToken = 'xoxe-1-XXX';
          delete botLatest.user.token;
          delete botLatest.user.refreshToken;
          delete botLatest.user.scopes;
          delete botLatest.user.expiresAt;
        } else {
          assert.fail('the test data is invalid');
        }
        await this.installationStore.storeInstallation(botLatest, this.logger);

        // fetchInstallation tests
        const user1Query = {
          enterpriseId: 'test-enterprise-id',
          teamId: 'test-team-id',
          userId: 'test-user-id-1',
          isEnterpriseInstall: false,
        };
        let userInstallation = await this.installationStore.fetchInstallation(
          user1Query,
          this.logger,
        );
        // User 1's user token
        verifyFetchedUserInstallationIsLatestOne(
          userInstallation,
          tokenExpiresAt,
        );
        // The latest bot token from user 2
        verifyFetchedBotInstallationIsLatestOne(
          userInstallation,
          tokenExpiresAt,
        );

        const botQuery = {
          enterpriseId: 'test-enterprise-id',
          teamId: 'test-team-id',
          isEnterpriseInstall: false,
        };
        let botInstallation = await this.installationStore.fetchInstallation(
          botQuery,
          this.logger,
        );
        // The latest bot token from user 2
        verifyFetchedBotInstallationIsLatestOne(
          botInstallation,
          tokenExpiresAt,
        );

        if (this.installationStore.deleteInstallation !== undefined) {
          await this.installationStore.deleteInstallation(
            user1Query,
            this.logger,
          );

          userInstallation = await this.installationStore.fetchInstallation(
            user1Query,
            this.logger,
          );
          // userToken no longer exists but bot data should be still alive
          assert.notExists(userInstallation.user.token);
          // The latest bot token from user 2
          verifyFetchedBotInstallationIsLatestOne(
            userInstallation,
            tokenExpiresAt,
          );

          botInstallation = await this.installationStore.fetchInstallation(
            botQuery,
            this.logger,
          );
          // The latest bot token from user 2
          verifyFetchedBotInstallationIsLatestOne(
            botInstallation,
            tokenExpiresAt,
          );

          await this.installationStore.deleteInstallation(botQuery, this.logger);

          try {
            await this.installationStore.fetchInstallation(botQuery, this.logger);
            assert.fail('Exception should be thrown here');
          } catch (e: any) {
            assert.equal(
              e.message,
              'No installation data found (enterprise_id: test-enterprise-id, team_id: test-team-id, user_id: undefined)',
            );
          }
        }

        // Managing multiple Slack apps in a single database table
        // A different app A stores a token with user 2
        const appABotInstallation: Installation = JSON.parse(
          JSON.stringify(inputInstallation),
        );
        appABotInstallation.user.id = 'test-user-id-2';
        if (appABotInstallation.bot) {
          appABotInstallation.bot.token = 'xoxb-XXX';
          appABotInstallation.bot.refreshToken = 'xoxe-1-XXX';
        } else {
          assert.fail('the test data is invalid');
        }
        await this.installationStore_ClientID_A.storeInstallation(
          appABotInstallation,
          this.logger,
        );

        // App A should find the installation
        const shouldBeFoundBot = await this.installationStore_ClientID_A.fetchInstallation(
          botQuery,
          this.logger,
        );
        assert.isNotNull(shouldBeFoundBot);
        const appAUserInstallation: Installation = JSON.parse(
          JSON.stringify(inputInstallation),
        );
        await this.installationStore_ClientID_A.storeInstallation(
          appAUserInstallation,
          this.logger,
        );
        const shouldBeFoundUser = await this.installationStore_ClientID_A.fetchInstallation(
          user1Query,
          this.logger,
        );
        assert.isNotNull(shouldBeFoundUser);

        // If an installation store is not client_id wired,
        // the above app A data should not be returned.
        try {
          await this.installationStore.fetchInstallation(botQuery, this.logger);
          assert.fail('Exception should be thrown here');
        } catch (e: any) {
          assert.equal(
            e.message,
            'No installation data found (enterprise_id: test-enterprise-id, team_id: test-team-id, user_id: undefined)',
          );
        }
        try {
          await this.installationStore.fetchInstallation(user1Query, this.logger);
          assert.fail('Exception should be thrown here');
        } catch (e: any) {
          assert.equal(
            e.message,
            'No installation data found (enterprise_id: test-enterprise-id, team_id: test-team-id, user_id: test-user-id-1)',
          );
        }

        // The installation store for a different app should not be able to accees
        // app A's installation data even for the same workspace.
        try {
          await this.installationStore_ClientID_B.fetchInstallation(
            botQuery,
            this.logger,
          );
          assert.fail('Exception should be thrown here');
        } catch (e: any) {
          assert.equal(
            e.message,
            'No installation data found (enterprise_id: test-enterprise-id, team_id: test-team-id, user_id: undefined)',
          );
        }
        try {
          await this.installationStore_ClientID_B.fetchInstallation(
            user1Query,
            this.logger,
          );
          assert.fail('Exception should be thrown here');
        } catch (e: any) {
          assert.equal(
            e.message,
            'No installation data found (enterprise_id: test-enterprise-id, team_id: test-team-id, user_id: test-user-id-1)',
          );
        }
      } finally {
        [
          this.installationStore,
          this.installationStore_ClientID_A,
          this.installationStore_ClientID_B,
        ].forEach(async (s) => {
          if (typeof (s as any).close === 'function') {
            await (s as any).close();
          }
        });
      }
    } catch (e) {
      console.trace(e);
      throw e;
    }
  }
}
