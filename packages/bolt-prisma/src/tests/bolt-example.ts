/* eslint-disable import/no-internal-modules */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/extensions */

import { App } from '@slack/bolt';
import { ConsoleLogger, LogLevel } from '@slack/logger';
import { PrismaClient } from '@prisma/client';
import { PrismaInstallationStore } from '../index';

const logger = new ConsoleLogger();
logger.setLevel(LogLevel.DEBUG);

const prismaClient = new PrismaClient({
  log: [
    {
      emit: 'stdout',
      level: 'query',
    },
  ],
});
const installationStore = new PrismaInstallationStore({
  prismaTable: prismaClient.mySlackAppInstallation,
  clientId: process.env.SLACK_CLIENT_ID,
  logger,
  onFetchInstallation: async ({ query, installation }) => {
    logger.info(query);
    logger.info(installation);
  },
  onStoreInstallation: async ({ prismaInput, installation }) => {
    logger.info(installation);
    logger.info(prismaInput);
    // eslint-disable-next-line no-param-reassign
    prismaInput.memo = 'test';
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
