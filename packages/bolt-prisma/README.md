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
    "@slack/bolt": "^3.11.0",
    "@seratch_/bolt-prisma": "^1.0.0",
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
    @@map("slack_app_installation")

    id                              Int       @id @default(autoincrement())
    clientId                        String?   @map("client_id")
    appId                           String?   @map("app_id")
    enterpriseId                    String?   @map("enterprise_id")
    enterpriseName                  String?   @map("enterprise_name")
    enterpriseUrl                   String?   @map("enterprise_url")
    teamId                          String?   @map("team_id")
    teamName                        String?   @map("team_name")
    botToken                        String?   @map("bot_token")
    botId                           String?   @map("bot_id")
    botUserId                       String?   @map("bot_user_id")
    botScopes                       String?   @map("bot_scopes")
    botRefreshToken                 String?   @map("bot_refresh_token")
    botTokenExpiresAt               DateTime? @map("bot_token_expires_at")
    userId                          String?   @map("user_id")
    userToken                       String?   @map("user_token")
    userScopes                      String?   @map("user_scopes")
    userRefreshToken                String?   @map("user_refresh_token")
    userTokenExpiresAt              DateTime? @map("user_token_expires_at")
    incomingWebhookUrl              String?   @map("incoming_webhook_url")
    incomingWebhookChannel          String?   @map("incoming_webhook_channel")
    incomingWebhookChannelId        String?   @map("incoming_webhook_channel_id")
    incomingWebhookConfigurationUrl String?   @map("incoming_webhook_configuration_url")
    isEnterpriseInstall             Boolean   @default(false) @map("is_enterprise_install")
    tokenType                       String    @default("bot") @map("token_type")
    installedAt                     DateTime  @default(now()) @map("installed_at")
    // This is an example custom property
    memo                            String?
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
import { PrismaInstallationStore } from '@seratch_/bolt-prisma';

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
  // The name `slackAppInstallation` can be different
  // if you use a different name in your Prisma schema
  prismaTable: prismaClient.slackAppInstallation,
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
# Visit https://{your public domain}/slack/install
```
