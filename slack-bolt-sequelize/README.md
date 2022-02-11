## Bolt for JavaScript Sequelize Extension

### Getting Started

#### Create a new project

##### package.json

```json
{
  "name": "bolt-sequelize-app",
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
    "slack-bolt-typeorm": "^0.0.2",
    "sqlite3": "4.2.0",
    "sequelize": "^6.16.1"
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
  name: typeorm-oauth-test-app
features:
  bot_user:
    display_name: typeorm-oauth-test-app
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

##### ormconfig.js

Just to confirm if the InstallationStore works in your local machine, let's use the following simple TypeORM configuration.

```javascript
const SnakeNamingStrategy = require("typeorm-naming-strategies").SnakeNamingStrategy;

module.exports = {
  type: "sqlite",
  database: "./database.sqlite",
  synchronize: true,
  keepConnectionAlive: true,
  logging: true,
  entities: ["src/entity/**/*.ts"],
  migrations: ["src/migration/**/*.ts"],
  cli: {
    entitiesDir: "src/entity",
    migrationsDir: "src/migration",
  },
  namingStrategy: new SnakeNamingStrategy(),
};
```

##### src/entity/SlackAppInstallation.ts

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { InstallationEntity } from 'slack-bolt-typeorm';

@Entity()
export default class SlackAppInstallation implements InstallationEntity {
  @PrimaryGeneratedColumn()
  public id?: number;

  @Column({ nullable: true })
  public clientId?: string;

  @Column()
  public appId?: string;

  @Column({ nullable: true })
  public enterpriseId?: string;

  @Column({ nullable: true })
  public enterpriseName?: string;

  @Column({ nullable: true })
  public enterpriseUrl?: string;

  @Column({ nullable: true })
  public teamId?: string;

  @Column({ nullable: true })
  public teamName?: string;

  @Column({ nullable: true })
  public botToken?: string;

  @Column({ nullable: true })
  public botId?: string;

  @Column({ nullable: true })
  public botUserId?: string;

  @Column({ nullable: true })
  public botScopes?: string;

  @Column({ nullable: true })
  public botRefreshToken?: string;

  @Column({ nullable: true })
  public botTokenExpiresAt?: Date;

  @Column({ nullable: true })
  public userId?: string;

  @Column({ nullable: true })
  public userToken?: string;

  @Column({ nullable: true })
  public userScopes?: string;

  @Column({ nullable: true })
  public userRefreshToken?: string;

  @Column({ nullable: true })
  public userTokenExpiresAt?: Date;

  @Column({ nullable: true })
  public incomingWebhookUrl?: string;

  @Column({ nullable: true })
  public incomingWebhookChannel?: string;

  @Column({ nullable: true })
  public incomingWebhookChannelId?: string;

  @Column({ nullable: true })
  public incomingWebhookConfigurationUrl?: string;

  @Column({ nullable: true })
  public isEnterpriseInstall?: boolean;

  @Column()
  public tokenType?: string;

  @Column()
  public installedAt?: Date;
}
```

##### src/index.ts

```typescript
import { createConnection } from 'typeorm';
import { App } from '@slack/bolt';
import { ConsoleLogger, LogLevel } from '@slack/logger';
import { TypeORMInstallationStore } from 'slack-bolt-typeorm';
import SlackAppInstallation from './entity/SlackAppInstallation';

const logger = new ConsoleLogger();
logger.setLevel(LogLevel.DEBUG);

const installationStore = new TypeORMInstallationStore({
  connectionProvider: async () => createConnection(),
  entityFactory: () => new SlackAppInstallation(),
  entityTarget: SlackAppInstallation,
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
