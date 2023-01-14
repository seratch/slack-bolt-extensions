import Router from '@koa/router';
import Koa from 'koa';
import { App, FileInstallationStore, LogLevel } from '@slack/bolt';
import { FileStateStore } from '@slack/oauth';
import KoaReceiver from '../receivers/KoaReceiver';

const koa = new Koa();
const router = new Router();

const receiver = new KoaReceiver({
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  scopes: ['commands', 'chat:write', 'app_mentions:read'],
  installationStore: new FileInstallationStore(),
  installerOptions: {
    directInstall: true,
    stateStore: new FileStateStore({}),
  },
  koa,
  router,
});

const app = new App({
  logLevel: LogLevel.DEBUG,
  receiver,
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

app.command('/my-command', async ({ ack }) => {
  await ack('Hi there!');
});

app.shortcut('my-global-shortcut', async ({ ack, body, client }) => {
  await ack();
  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      callback_id: 'my-modal',
      title: {
        type: 'plain_text',
        text: 'My App',
      },
      submit: {
        type: 'plain_text',
        text: 'Submit',
      },
      blocks: [
        {
          type: 'input',
          block_id: 'b',
          element: {
            type: 'plain_text_input',
            action_id: 'a',
          },
          label: {
            type: 'plain_text',
            text: 'Comment',
          },
        },
      ],
    },
  });
});

app.view('my-modal', async ({ view, ack, logger }) => {
  logger.info(view.state.values);
  await ack();
});

(async () => {
  await app.start();
  // eslint-disable-next-line no-console
  console.log('⚡️ Bolt app is running!');
})();
