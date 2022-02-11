import { Installation } from '@slack/oauth';
import { ConsoleLogger, LogLevel } from '@slack/logger';
import { assert } from 'chai';
import { createConnection } from 'typeorm';
import { SlackAppInstallation, TypeORMInstallationStore } from './index';

describe('InstallationStore', () => {
  function verifyFetchedInstallationIsLatestOne(installation: Installation<'v1' | 'v2'>, expiresAt: number) {
    assert.isNotNull(installation);
    assert.equal(installation?.appId, 'test-app-id');
    assert.equal(installation?.bot?.token, 'xoxb-XXX');
    assert.equal(installation?.bot?.refreshToken, 'xoxe-1-XXX');
    assert.equal(installation?.bot?.expiresAt, expiresAt);
    assert.equal(installation?.user.expiresAt, expiresAt);
  }

  const logger = new ConsoleLogger();
  logger.setLevel(LogLevel.DEBUG);
  const tokenExpiresAt = new Date().getTime();
  const teamInstallation = {
    team: {
      id: 'test-team-id',
      name: 'team-team-name',
    },
    enterprise: {
      id: 'test-enterprise-id',
      name: 'test-enterprise-name',
    },
    bot: {
      token: 'xoxb-xxx',
      scopes: ['commands', 'chat:write'],
      id: 'test-bot-id',
      userId: 'test-bot-user-id',
      refreshToken: 'xoxe-1-xxx',
      expiresAt: tokenExpiresAt,
    },
    user: {
      token: 'xoxp-yyy',
      id: 'test-user-id',
      scopes: ['search:read'],
      refreshToken: 'xoxe-1-yyy',
      expiresAt: tokenExpiresAt,
    },
    incomingWebhook: {
      url: 'https://www.example.com/webhooks/xxx',
      channel: 'channel name',
      channelId: 'channel ID',
      configurationUrl: 'https://www.example.com/webhooks/configuration/xxx',
    },
    appId: 'test-app-id',
    isEnterpriseInstall: false,
  };

  it('saves and finds an installation', async () => {
    // namingStrategy is passed in ormconfig.js
    const conn = await createConnection();
    try {
      // simple workspace-level installation
      const installationStore = new TypeORMInstallationStore({
        connection: conn,
        entityFactory: () => new SlackAppInstallation(),
        entityTarget: SlackAppInstallation,
      });
      await installationStore.storeInstallation(teamInstallation, logger);
      const latest: Installation = JSON.parse(JSON.stringify(teamInstallation));
      if (latest.bot) {
        latest.bot.token = 'xoxb-XXX';
        latest.bot.refreshToken = 'xoxe-1-XXX';
      } else {
        assert.fail('the test data is invalid');
      }
      await installationStore.storeInstallation(latest, logger);

      const userQuery = {
        enterpriseId: 'test-enterprise-id',
        teamId: 'test-team-id',
        userId: 'test-user-id',
        isEnterpriseInstall: false,
      };
      // the latest one should be returned here
      const installation = await installationStore.fetchInstallation(userQuery, logger);
      verifyFetchedInstallationIsLatestOne(installation, tokenExpiresAt);

      await installationStore.deleteInstallation(userQuery, logger);

      // As the installations including historical ones were deleted,
      // this fetch method must return nothing.
      try {
        await installationStore.fetchInstallation(userQuery, logger);
        assert.fail('Exception should be thrown here');
      } catch (e: any) {
        assert.equal(e.message, 'No installation data found (enterprise_id: test-enterprise-id, team_id: test-team-id, user_id: test-user-id)');
      }

      // Managing multiple Slack apps in a single database table
      const appAStore = new TypeORMInstallationStore({
        connection: conn,
        entityFactory: () => new SlackAppInstallation(),
        entityTarget: SlackAppInstallation,
        clientId: 'AAA',
      });
      const appAInstallation: Installation = JSON.parse(JSON.stringify(teamInstallation));
      await appAStore.storeInstallation(appAInstallation, logger);

      const shouldBeFound = await appAStore.fetchInstallation(userQuery, logger);
      assert.isNotNull(shouldBeFound);

      // If an installation store is not client_id wired,
      // the above app A data should not be returned.
      try {
        await installationStore.fetchInstallation(userQuery, logger);
        assert.fail('Exception should be thrown here');
      } catch (e: any) {
        assert.equal(e.message, 'No installation data found (enterprise_id: test-enterprise-id, team_id: test-team-id, user_id: test-user-id)');
      }

      // The installation store for a different app should not be able to accees
      // app A's installation data even for the same workspace.
      const appBStore = new TypeORMInstallationStore({
        connection: conn,
        entityFactory: () => new SlackAppInstallation(),
        entityTarget: SlackAppInstallation,
        clientId: 'BBB',
      });
      try {
        await appBStore.fetchInstallation(userQuery, logger);
        assert.fail('Exception should be thrown here');
      } catch (e: any) {
        assert.equal(e.message, 'No installation data found (enterprise_id: test-enterprise-id, team_id: test-team-id, user_id: test-user-id)');
      }
    } finally {
      await conn.close();
    }
  });
  it('saves and finds an installation (historical data disbaled)', async () => {
    // namingStrategy is passed in ormconfig.js
    const conn = await createConnection();
    try {
      // simple workspace-level installation
      const installationStore = new TypeORMInstallationStore({
        connection: conn,
        entityFactory: () => new SlackAppInstallation(),
        entityTarget: SlackAppInstallation,
        historicalDataEnabled: false,
      });
      await installationStore.storeInstallation(teamInstallation, logger);
      const latest: Installation = JSON.parse(JSON.stringify(teamInstallation));
      if (latest.bot) {
        latest.bot.token = 'xoxb-XXX';
        latest.bot.refreshToken = 'xoxe-1-XXX';
      } else {
        assert.fail('the test data is invalid');
      }
      await installationStore.storeInstallation(latest, logger);

      const userQuery = {
        enterpriseId: 'test-enterprise-id',
        teamId: 'test-team-id',
        userId: 'test-user-id',
        isEnterpriseInstall: false,
      };
      // the latest one should be returned here
      const installation = await installationStore.fetchInstallation(userQuery, logger);
      assert.isNotNull(installation);
      assert.equal(installation?.appId, 'test-app-id');
      assert.equal(installation?.bot?.token, 'xoxb-XXX');
      assert.equal(installation?.bot?.refreshToken, 'xoxe-1-XXX');
      assert.equal(installation?.bot?.expiresAt, tokenExpiresAt);
      assert.equal(installation?.user.expiresAt, tokenExpiresAt);

      await installationStore.deleteInstallation(userQuery, logger);

      // As the installations including historical ones were deleted,
      // this fetch method must return nothing.
      try {
        await installationStore.fetchInstallation(userQuery, logger);
        assert.fail('Exception should be thrown here');
      } catch (e: any) {
        assert.equal(e.message, 'No installation data found (enterprise_id: test-enterprise-id, team_id: test-team-id, user_id: test-user-id)');
      }

      // Managing multiple Slack apps in a single database table
      const appAStore = new TypeORMInstallationStore({
        connection: conn,
        entityFactory: () => new SlackAppInstallation(),
        entityTarget: SlackAppInstallation,
        clientId: 'AAA',
        historicalDataEnabled: false,
      });
      const appAInstallation: Installation = JSON.parse(JSON.stringify(teamInstallation));
      await appAStore.storeInstallation(appAInstallation, logger);

      const shouldBeFound = await appAStore.fetchInstallation(userQuery, logger);
      assert.isNotNull(shouldBeFound);

      // If an installation store is not client_id wired,
      // the above app A data should not be returned.
      try {
        await installationStore.fetchInstallation(userQuery, logger);
        assert.fail('Exception should be thrown here');
      } catch (e: any) {
        assert.equal(e.message, 'No installation data found (enterprise_id: test-enterprise-id, team_id: test-team-id, user_id: test-user-id)');
      }

      // The installation store for a different app should not be able to accees
      // app A's installation data even for the same workspace.
      const appBStore = new TypeORMInstallationStore({
        connection: conn,
        entityFactory: () => new SlackAppInstallation(),
        entityTarget: SlackAppInstallation,
        clientId: 'BBB',
        historicalDataEnabled: false,
      });
      try {
        await appBStore.fetchInstallation(userQuery, logger);
        assert.fail('Exception should be thrown here');
      } catch (e: any) {
        assert.equal(e.message, 'No installation data found (enterprise_id: test-enterprise-id, team_id: test-team-id, user_id: test-user-id)');
      }
    } finally {
      await conn.close();
    }
  });
  // TODO: org-wide
});
