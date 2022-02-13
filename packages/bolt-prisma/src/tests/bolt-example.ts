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
  prismaClient,
  clientId: process.env.SLACK_CLIENT_ID,
  logger,
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

async function processExistHandler(args: any) {
  logger.info(`processExistHandler args: ${args}`);
  process.exit();
}
process.on('SIGINT', async (args) => await processExistHandler(args));
process.on('SIGUSR1', async (args) => await processExistHandler(args));
process.on('SIGUSR2', async (args) => await processExistHandler(args));
process.on('uncaughtException', async (args) => await processExistHandler(args));
process.on('exit', async (code) => {
  await installationStore.close();
  process.exit(code);
});
