/* eslint-disable no-param-reassign */
/* eslint-disable import/no-internal-modules */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/extensions */

import { App } from '@slack/bolt';
import { ConsoleLogger, LogLevel } from '@slack/logger';
import { Mongoose } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseInstallationStore } from '../index';

const logger = new ConsoleLogger();
logger.setLevel(LogLevel.DEBUG);

const mongoose = new Mongoose({
  debug: true,
});
const installationStore = new MongooseInstallationStore({
  mongoose,
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
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await app.start();
  logger.info('⚡️ Bolt app is running!');
})();
