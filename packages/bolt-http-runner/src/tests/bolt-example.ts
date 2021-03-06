import http, { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { App, FileInstallationStore, LogLevel } from '@slack/bolt';
import { FileStateStore } from '@slack/oauth';
import AppRunner from '../AppRunner';

const runner = new AppRunner({
  logLevel: LogLevel.DEBUG,
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
});

const app = new App(runner.appOptions());

app.event('app_mention', async ({ say }) => {
  await say('Hi there!');
});

runner.setup(app);

(async () => {
  http.createServer((req: IncomingMessage, res: ServerResponse) => {
    const { pathname: path } = new URL(req.url as string, 'http://localhost');
    if (req.method === 'POST' && path === '/slack/events') {
      runner.handleEvents(req, res);
    } else if (req.method === 'GET' && path === '/slack/install') {
      runner.handleInstallPath(req, res);
    } else if (req.method === 'GET' && path === '/slack/oauth_redirect') {
      runner.handleCallback(req, res);
    } else {
      res.writeHead(404);
      res.end();
    }
  }).listen(3000);
  // eslint-disable-next-line no-console
  console.log('⚡️ Bolt app is running!');
})();
