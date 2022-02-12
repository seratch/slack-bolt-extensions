/* eslint-disable import/no-internal-modules */
/* eslint-disable import/extensions */

import { Installation } from '@slack/oauth';
import { ConsoleLogger, LogLevel } from '@slack/logger';
import { assert } from 'chai';
import { Sequelize } from 'sequelize';
import { SequelizeInstallationStore } from '../index';
import { buildOrgWideInstallation } from './test-data';

const logger = new ConsoleLogger();
logger.setLevel(LogLevel.DEBUG);

describe('Org-wide installation', () => {
  it('saves and finds an installation', async () => {
    await runAllTests(true);
  });
  it('saves and finds an installation (historical data disabled)', async () => {
    await runAllTests(false);
  });

  function verifyFetchedBotInstallationIsLatestOne(installation: Installation<'v1' | 'v2'>, expiresAt: number) {
    assert.isNotNull(installation);
    assert.equal(installation?.appId, 'test-app-id');
    assert.equal(installation?.bot?.token, 'xoxb-XXX');
    assert.equal(installation?.bot?.refreshToken, 'xoxe-1-XXX');
    assert.equal(installation?.bot?.expiresAt, expiresAt);
  }
  function verifyFetchedUserInstallationIsLatestOne(installation: Installation<'v1' | 'v2'>, expiresAt: number) {
    assert.isNotNull(installation);
    assert.equal(installation?.appId, 'test-app-id');
    assert.equal(installation?.user.token, 'xoxp-YYY');
    assert.equal(installation?.user.refreshToken, 'xoxe-1-YYY');
    assert.equal(installation?.user.expiresAt, expiresAt);
  }

  const tokenExpiresAt = new Date().getTime();
  const inputInstallation = buildOrgWideInstallation(tokenExpiresAt);

  async function runAllTests(historicalDataEnabled: boolean) {
    const sequelize = new Sequelize('sqlite::memory:');
    // --------------------------------------------------
    // Create a few installations
    // - two installations by user 1
    // - one installation by user 2

    const installationStore = new SequelizeInstallationStore({
      sequelize,
      historicalDataEnabled,
    });

    const appAStore = new SequelizeInstallationStore({
      sequelize,
      clientId: 'AAA',
      historicalDataEnabled,
    });

    const appBStore = new SequelizeInstallationStore({
      sequelize,
      clientId: 'BBB',
      historicalDataEnabled,
    });

    try {
      await installationStore.storeInstallation(inputInstallation, logger);

      const userLatest: Installation = JSON.parse(JSON.stringify(inputInstallation));
      if (userLatest.bot) {
        userLatest.user.token = 'xoxp-YYY';
        userLatest.user.refreshToken = 'xoxe-1-YYY';
      } else {
        assert.fail('the test data is invalid');
      }
      await installationStore.storeInstallation(userLatest, logger);

      const botLatest: Installation = JSON.parse(JSON.stringify(inputInstallation));
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
      await installationStore.storeInstallation(botLatest, logger);

      // --------------------------------------------------
      // the latest one should be returned here
      const user1Query = {
        enterpriseId: 'test-enterprise-id',
        teamId: undefined,
        userId: 'test-user-id-1',
        isEnterpriseInstall: true,
      };
      let userInstallation = await installationStore.fetchInstallation(user1Query, logger);
      verifyFetchedUserInstallationIsLatestOne(userInstallation, tokenExpiresAt);
      verifyFetchedBotInstallationIsLatestOne(userInstallation, tokenExpiresAt);

      const botQuery = {
        enterpriseId: 'test-enterprise-id',
        teamId: undefined,
        isEnterpriseInstall: true,
      };
      let botInstallation = await installationStore.fetchInstallation(botQuery, logger);
      verifyFetchedBotInstallationIsLatestOne(botInstallation, tokenExpiresAt);

      await installationStore.deleteInstallation(user1Query, logger);

      userInstallation = await installationStore.fetchInstallation(user1Query, logger);
      // userToken no longer exists but bot data should be still alive
      assert.isNull(userInstallation.user.token);
      verifyFetchedBotInstallationIsLatestOne(userInstallation, tokenExpiresAt);

      botInstallation = await installationStore.fetchInstallation(botQuery, logger);
      verifyFetchedBotInstallationIsLatestOne(botInstallation, tokenExpiresAt);

      await installationStore.deleteInstallation(botQuery, logger);

      try {
        await installationStore.fetchInstallation(botQuery, logger);
        assert.fail('Exception should be thrown here');
      } catch (e: any) {
        assert.equal(e.message, 'No installation data found (enterprise_id: test-enterprise-id, team_id: undefined, user_id: undefined)');
      }

      // Managing multiple Slack apps in a single database table
      const appABotInstallation: Installation = JSON.parse(JSON.stringify(inputInstallation));
      appABotInstallation.user.id = 'test-user-id-2';
      if (appABotInstallation.bot) {
        appABotInstallation.bot.token = 'xoxb-XXX';
        appABotInstallation.bot.refreshToken = 'xoxe-1-XXX';
      } else {
        assert.fail('the test data is invalid');
      }
      await appAStore.storeInstallation(appABotInstallation, logger);
      const shouldBeFoundBot = await appAStore.fetchInstallation(botQuery, logger);
      assert.isNotNull(shouldBeFoundBot);

      const appAUserInstallation: Installation = JSON.parse(JSON.stringify(inputInstallation));
      await appAStore.storeInstallation(appAUserInstallation, logger);
      const shouldBeFoundUser = await appAStore.fetchInstallation(user1Query, logger);
      assert.isNotNull(shouldBeFoundUser);

      // If an installation store is not client_id wired,
      // the above app A data should not be returned.
      try {
        await installationStore.fetchInstallation(botQuery, logger);
        assert.fail('Exception should be thrown here');
      } catch (e: any) {
        assert.equal(e.message, 'No installation data found (enterprise_id: test-enterprise-id, team_id: undefined, user_id: undefined)');
      }
      try {
        await installationStore.fetchInstallation(user1Query, logger);
        assert.fail('Exception should be thrown here');
      } catch (e: any) {
        assert.equal(e.message, 'No installation data found (enterprise_id: test-enterprise-id, team_id: undefined, user_id: test-user-id-1)');
      }

      // The installation store for a different app should not be able to accees
      // app A's installation data even for the same workspace.
      try {
        await appBStore.fetchInstallation(botQuery, logger);
        assert.fail('Exception should be thrown here');
      } catch (e: any) {
        assert.equal(e.message, 'No installation data found (enterprise_id: test-enterprise-id, team_id: undefined, user_id: undefined)');
      }
      try {
        await appBStore.fetchInstallation(user1Query, logger);
        assert.fail('Exception should be thrown here');
      } catch (e: any) {
        assert.equal(e.message, 'No installation data found (enterprise_id: test-enterprise-id, team_id: undefined, user_id: test-user-id-1)');
      }
    } finally {
      [installationStore, appAStore, appBStore].forEach(async (s) => {
        await s.close();
      });
    }
  }
});
