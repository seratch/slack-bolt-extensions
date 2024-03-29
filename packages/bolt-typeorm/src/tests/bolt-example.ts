/* eslint-disable import/no-internal-modules */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/extensions */

import { App } from '@slack/bolt';
import { ConsoleLogger, LogLevel } from '@slack/logger';
import { createConnection } from 'typeorm';
import { InstallationEntity, TypeORMInstallationStore } from '../index';
import SlackAppInstallation from '../entity/SlackAppInstallation';

const logger = new ConsoleLogger();
logger.setLevel(LogLevel.DEBUG);

interface CustomInstallationEntity extends InstallationEntity {
  memo?: string;
}

const installationStore = new TypeORMInstallationStore<CustomInstallationEntity>({
  connectionProvider: async () => createConnection('bolt-example-app'),
  entityFactory: () => new SlackAppInstallation(),
  entityTarget: SlackAppInstallation,
  clientId: process.env.SLACK_CLIENT_ID,
  logger,
  onStoreInstallation: async ({ entity, installation }) => {
    // You can encrypt/decrypt values and add custom data
    // eslint-disable-next-line no-param-reassign
    entity.memo = 'This is noted';
    logger.info(entity);
    logger.info(installation);
  },
  onFetchInstallation: async ({ entity, installation, query }) => {
    // You can encrypt/decrypt values and add custom data
    logger.info(entity);
    logger.info(installation);
    logger.info(query);
  },
  onDeleteInstallation: async ({ query }) => {
    logger.info(query);
  },
});

const app = new App({
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: process.env.SLACK_STATE_SECRET,
  scopes: ['commands', 'chat:write', 'app_mentions:read'],
  installerOptions: {
    directInstall: true,
  },
  installationStore,
  logger,
});

app.event('app_mention', async ({ event, say }) => {
  await say({
    text: `<@${event.user}> Hi there :wave:`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `<@${event.user}> Hi there :wave:`,
        },
      },
    ],
  });
});

(async () => {
  await app.start();
  logger.info('⚡️ Bolt app is running!');
})();
