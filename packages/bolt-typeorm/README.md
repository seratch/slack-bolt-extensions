## Bolt for JavaScript: TypeORM InstallationStore

This module provides an `InstallationStore` implementation for [TypeORM](https://typeorm.io/) users.

### Getting Started

You can create a simple Node app project using the following `package.json` and `tsconfig.json`. Of course, if you would like to use some build tool such as [webpack](https://webpack.js.org/), you can go with your own way and add the necessary dependencies.

##### package.json

```json
{
  "name": "bolt-typeorm-app",
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
    "@seratch_/bolt-typeorm": "^1.0.0",
    "sqlite3": "4.2.0",
    "typeorm": "^0.2.41",
    "typeorm-naming-strategies": "^2.0.0"
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

### Place your source code in the project

The last step is to add your code in the project and spin up your app. You can use the following code as-is.

##### ormconfig.js

This file is required for configuring your TypeORM database clients. If you would like to use other database apart from SQLite, you can modify the settings.

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
import { InstallationEntity } from '@seratch_/bolt-typeorm';

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
import { TypeORMInstallationStore } from '@seratch_/bolt-typeorm';
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

Finally, your app is now available for running! Set all the required env variables, hit `npm start`, and then enable your public URL endpoint (you may want to use some proxy tool such as [ngrok](https://ngrok.com/)).

```bash
export SLACK_CLIENT_ID=
export SLACK_CLIENT_SECRET=
export SLACK_SIGNING_SECRET=
export SLACK_STATE_SECRET=secret
export SLACK_APP_TOKEN=
npm start
# Visit https://{your public domain}/slack/install
```

Now you can install the app into your Slack workspace from `https://{your public domain}/slack/install`. Enjoy!
