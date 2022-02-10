import { assert } from 'chai';
import { createConnection } from 'typeorm';
import { TypeORMInstallationStore } from './index';

describe('InstallationStore', () => {
  const expiresAt = new Date().getTime();
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
      expiresAt,
    },
    user: {
      token: 'xoxp-yyy',
      id: 'test-user-id',
      scopes: ['search:read'],
      refreshToken: 'xoxe-1-yyy',
      expiresAt,
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
    const conn = await createConnection();
    try {
      const installationStore = new TypeORMInstallationStore({ connection: conn });
      await installationStore.storeInstallation(teamInstallation);
      await installationStore.storeInstallation(teamInstallation);
      await installationStore.storeInstallation(teamInstallation);

      const query = {
        enterpriseId: 'test-enterprise-id',
        teamId: 'test-team-id',
        userId: 'test-user-id',
        isEnterpriseInstall: false,
      };
      const installation = await installationStore.fetchInstallation(query);
      assert.isNotNull(installation);
      assert.equal(installation?.appId, 'test-app-id');
      assert.equal(installation?.bot?.token, 'xoxb-xxx');
      assert.equal(installation?.bot?.refreshToken, 'xoxe-1-xxx');
      assert.equal(installation?.bot?.expiresAt, expiresAt);
      assert.equal(installation?.user.expiresAt, expiresAt);

      await installationStore.deleteInstallation(query);

      try {
        await installationStore.fetchInstallation(query);
        assert.fail('Exception should be thrown here');
      } catch (e: any) {
        assert.equal(e.message, 'No installation data found (enterprise_id: test-enterprise-id, team_id: test-team-id, user_id: test-user-id)');
      }
    } finally {
      await conn.close();
    }
  });
});
