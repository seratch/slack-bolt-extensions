## Bolt for JavaScript Prisma Extension

### Getting Started

#### Create a new project

##### package.json

```json
{
  "name": "bolt-prisma-app",
  "version": "0.1.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "start": "rm -rf dist/ && tsc && npx ts-node src/index.ts"
  },
  "author": "Kazuhiro Sera",
  "license": "MIT",
  "dependencies": {
    "@slack/bolt": "^3.9.0",
    "slack-bolt-prisma": "^0.0.2",
    "sqlite3": "4.2.0",
    "@prisma/client": "^3.9.2"
  },
  "devDependencies": {
    "prisma": "^3.9.2",
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
  name: prisma-oauth-test-app
features:
  bot_user:
    display_name: prisma-oauth-test-app
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

##### prisma/schema.prisma

```prisma
generator client {
    provider = "prisma-client-js"
}

datasource db {
    provider = "sqlite"
    url      = env("DATABASE_URL")
}

model SlackAppInstallation {
    id                              Int       @id @default(autoincrement())
    clientId                        String?
    appId                           String?
    enterpriseId                    String?
    enterpriseName                  String?
    enterpriseUrl                   String?
    teamId                          String?
    teamName                        String?
    botToken                        String?
    botId                           String?
    botUserId                       String?
    botScopes                       String?
    botRefreshToken                 String?
    botTokenExpiresAt               DateTime?
    userId                          String?
    userToken                       String?
    userScopes                      String?
    userRefreshToken                String?
    userTokenExpiresAt              DateTime?
    incomingWebhookUrl              String?
    incomingWebhookChannel          String?
    incomingWebhookChannelId        String?
    incomingWebhookConfigurationUrl String?
    isEnterpriseInstall             Boolean   @default(false)
    tokenType                       String    @default("bot")
    installedAt                     DateTime  @default(now())
}
```

```bash
npm i
export DATABASE_URL="file:./dev.db"
npx prisma migrate dev --name init
npx prisma generate
```

##### src/index.ts

```typescript
import { App } from '@slack/bolt';
import { ConsoleLogger, LogLevel } from '@slack/logger';
import { PrismaClient } from '@prisma/client';
import { PrismaInstallationStore } from 'slack-bolt-prisma';

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
```

#### Run the app

```
export SLACK_CLIENT_ID=
export SLACK_CLIENT_SECRET=
export SLACK_SIGNING_SECRET=
export SLACK_STATE_SECRET=secret
export SLACK_APP_TOKEN=
npm start
```
