/* eslint-disable no-param-reassign */
/* eslint-disable import/no-internal-modules */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/extensions */

import { App } from '@slack/bolt';
import { ConsoleLogger, LogLevel } from '@slack/logger';
import { DataTypes, Sequelize } from 'sequelize';
import { SequelizeInstallationStore, SlackAppInstallation } from '../index';

const logger = new ConsoleLogger();
logger.setLevel(LogLevel.DEBUG);

const sequelize = new Sequelize('sqlite::memory:');

/**
const simplestInstallationStore = new SequelizeInstallationStore({
  sequelize,
  clientId: process.env.SLACK_CLIENT_ID,
  logger,
});
 */

class MySlackAppInstallation extends SlackAppInstallation {
  public memo?: string;
}
const modelAttributes = SlackAppInstallation.buildNewModelAttributes();
// Set custom columns in database
modelAttributes.memo = { type: DataTypes.STRING, allowNull: true };

MySlackAppInstallation.init(
  modelAttributes,
  { sequelize, modelName: 'my_slack_app_installation' },
);

const installationStore = new SequelizeInstallationStore<MySlackAppInstallation>({
  sequelize,
  model: MySlackAppInstallation,
  clientId: process.env.SLACK_CLIENT_ID,
  onStoreInstallation: async ({ model, installation }) => {
    // You can encrypt/decrypt values and add custom data
    model.memo = 'This is noted';
    logger.info(model);
    logger.info(installation);
  },
  onFetchInstallation: async ({ model, installation, query }) => {
    // You can encrypt/decrypt values and add custom data
    logger.info(model);
    logger.info(installation);
    logger.info(query);
  },
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
