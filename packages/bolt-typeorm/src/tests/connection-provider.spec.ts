/* eslint-disable import/no-internal-modules */
/* eslint-disable import/extensions */

import { Installation } from '@slack/oauth';
import { assert } from 'chai';
import { createConnection } from 'typeorm';
import { noopLogger } from 'bolt-extension-test-kit';
import { TypeORMInstallationStore } from '../index';
import SlackAppInstallation from '../entity/SlackAppInstallation';
import { buildTeamInstallation } from './test-data';

const logger = noopLogger;

const tokenExpiresAt = new Date().getTime();
const inputInstallation = buildTeamInstallation(tokenExpiresAt);

describe('ConnectionProvider', () => {
  it('works with connectionProvider', async () => {
    const installationStore = new TypeORMInstallationStore({
      connectionProvider: async () => createConnection('connection-provider-tests'),
      entityFactory: () => new SlackAppInstallation(),
      entityTarget: SlackAppInstallation,
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
      } else {
        assert.fail('the test data is invalid');
      }
      await installationStore.storeInstallation(botLatest, logger);
      const botQuery = {
        enterpriseId: 'test-enterprise-id',
        teamId: 'test-team-id',
        isEnterpriseInstall: false,
      };
      await installationStore.fetchInstallation(botQuery, logger);

      // As the installations including historical ones were deleted,
      // this fetch method must return nothing.
      await installationStore.fetchInstallation(botQuery, logger);
      await installationStore.deleteInstallation(botQuery, logger);

      try {
        await installationStore.fetchInstallation(botQuery, logger);
        assert.fail('Exception should be thrown here');
      } catch (e: any) {
        assert.equal(e.message, 'No installation data found (enterprise_id: test-enterprise-id, team_id: test-team-id, user_id: undefined)');
      }
    } finally {
      await installationStore.close();
    }
  });
});
