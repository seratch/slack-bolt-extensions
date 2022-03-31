## Bolt for JavaScript Extension

### Getting Started

#### Create a new project

##### package.json

```json
{
  "name": "bolt-app-runner-example",
  "version": "0.1.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "start": "rm -rf dist/ && tsc && npx ts-node src/index.ts"
  },
  "author": "Kazuhiro Sera",
  "license": "MIT",
  "dependencies": {
    "@slack/bolt": "^3.11.0",
    "@koa/router": "^10.1.1",
    "slack-bolt-http-runner": "^0.3.1"
  },
  "devDependencies": {
    "ts-node": "^10.5.0",
    "typescript": "^4.5.5"
  }
}
```

##### tsconfig.json

```json
{
  "compilerOptions": {
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowJs": true,
    "esModuleInterop": true,
    "outDir": "dist",
  },
  "include": ["src/**/*"]
}
```

##### Create a new Slack app at api.slack.com/apps

You can use the following App Manifest configuration for setting up a new app!

```yaml
display_information:
  name: bolt-oauth-test-app
features:
  bot_user:
    display_name: bolt-oauth-test-app
oauth_config:
  redirect_urls:
    - https://xxx.ngrok.io/slack/oauth_redirect
  scopes:
    bot:
      - commands
      - chat:write
      - app_mentions:read
settings:
  event_subscriptions:
    bot_events:
      - app_mention
  interactivity:
    is_enabled: true
  socket_mode_enabled: true
```

##### src/index.ts

```typescript
import http, { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { App, FileInstallationStore, LogLevel } from '@slack/bolt';
import { FileStateStore } from '@slack/oauth';
import { AppRunner } from 'slack-bolt-http-runner';

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
```

#### Run the app

```
export SLACK_CLIENT_ID=
export SLACK_CLIENT_SECRET=
export SLACK_SIGNING_SECRET=
export SLACK_STATE_SECRET=secret
npm start
# Visit https://{your public domain}/slack/install
```
