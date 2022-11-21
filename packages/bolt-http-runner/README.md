## Bolt HTTP Runner

This module provides a way to run your Bolt apps in a much simpler way. To be more specific, this module lets your Bolt apps free from the necessity to implement `Receiver` interface (or make the rest of your app to be compatible with it). With this approach, you can smoothly embed your Bolt apps as part of full-stack frameworks such as [Next.js](https://nextjs.org/) and [Nest.js](https://nestjs.com/).

### Getting Started

You can create a simple Node app project using the following `package.json` and `tsconfig.json`. Of course, if you would like to use some build tool such as [webpack](https://webpack.js.org/), you can go with your own way and add the necessary dependencies.

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
    "@slack/bolt": "^3.12.2",
    "@seratch_/bolt-http-runner": "^1.0.0"
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

The next step is to create a new Slack app configuration. You can use the following App Manifest configuration data for it.

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

### Place your source code in the project

The last step is to add your code in the project and spin up your app. You can use the following code as-is.

##### src/index.ts

```typescript
import http, { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { App, FileInstallationStore, LogLevel } from '@slack/bolt';
import { FileStateStore } from '@slack/oauth';
import { AppRunner } from '@seratch_/bolt-http-runner';

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

Finally, your app is now available for running! Set all the required env variables, hit `npm start`, and then enable your public URL endpoint (you may want to use some proxy tool such as [ngrok](https://ngrok.com/)).

```
export SLACK_CLIENT_ID=
export SLACK_CLIENT_SECRET=
export SLACK_SIGNING_SECRET=
export SLACK_STATE_SECRET=secret
npm start
# Visit https://{your public domain}/slack/install
```

Now you can install the app into your Slack workspace from `https://{your public domain}/slack/install`. Enjoy!
