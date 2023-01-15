## ⚡ Bolt for JavaScript Extensions

[![npm version](https://badge.fury.io/js/@seratch_%2Fbolt-prisma.svg)](https://badge.fury.io/js/@seratch_%2Fbolt-prisma) [![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

This project aims to provide the following enhancement on top of bolt-js.

* bolt-js `Receiver` implementations built with widely used web frameworks
* bolt-js `InstallationStore` implementations for widely used database libraries, databases, and cloud services
* [`bolt-http-runner`](https://github.com/seratch/slack-bolt-extensions/tree/main/packages/bolt-http-runner), which enables developers to run bolt-js code in [Next.js](https://github.com/seratch/slack-bolt-extensions/tree/main/nextjs-example)/[Nuxt.js](https://github.com/seratch/slack-bolt-extensions/tree/main/nestjs-example) apps (or whatever you want to use bolt-js along with)

### Receiver

At this moment, we support the following web frameworks. To learn how to use these `Receiver` in your bolt-js apps, check `src/tests/bolt-example.ts`. You can run the app by `npm run bolt` in each package directory.

* [@seratch_/bolt-koa](packages/bolt-koa) for [Koa](https://koajs.com/)
* [@seratch_/bolt-fastify](packages/bolt-fastify) for [Fastify](https://www.fastify.io/)

For instance, if you go with Prisma, your Bolt app code will look like the one below:

```typescript
import Router from '@koa/router';
import Koa from 'koa';
import { App, FileInstallationStore, LogLevel } from '@slack/bolt';
import { KoaReceiver } from '@seratch_/bolt-koa';

const koa = new Koa();
const router = new Router();

const receiver = new KoaReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  scopes: ['commands', 'chat:write', 'app_mentions:read'],
  installationStore: new FileInstallationStore(),
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

(async () => {
  await app.start();
  console.log('⚡️ Bolt app is running!');
})();
```

If you go with any of other packages, just replacing the `Receiver` part works for you.

### InstallationStore

At this moment, we support the following database libraries. To learn how to use these `InstallationStore` in your bolt-js apps, check `src/tests/bolt-example.ts`. You can run the app by `npm run bolt` in each package directory.

* [@seratch_/bolt-prisma](packages/bolt-prisma) for [Prisma](https://www.prisma.io/) (RDB / MongoDB)
* [@seratch_/bolt-mongoose](packages/bolt-mongoose) for [Mongoose](https://mongoosejs.com/) (MongoDB)
* [@seratch_/bolt-sequelize](packages/bolt-sequelize) for [Sequelize](https://sequelize.org/) (RDB)
* [@seratch_/bolt-typeorm](packages/bolt-typeorm) for [TypeORM](https://typeorm.io/) (RDB / MongoDB)
* @seratch_/bolt-amazon-s3 (_coming soon!_)
* @seratch_/bolt-aws-dynamodb (_coming soon!_)

For instance, if you go with Prisma, your Bolt app code will look like the one below:

```typescript
import { App } from '@slack/bolt';
import { PrismaClient } from '@prisma/client';
import { PrismaInstallationStore } from '@seratch_/bolt-prisma';

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
});
const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: process.env.SLACK_STATE_SECRET,
  scopes: ['commands', 'chat:write', 'app_mentions:read'],
  installationStore,
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
  console.log('⚡️ Bolt app is running!');
})();
```

If you go with any of other packages, just replacing the `installationStore` part works for you.

#### Features

All the packages guarantee they work with great consideration for the following points:

* InstallationStore in any of these packages returns the latest bot token plus the latest user token (only when it exists) for a query (enterprise_id / team_id / user_id / is_enterprise_install).
* Org-wide installations are also properly supported. All the packages have a unit test named `src/tests/org-wide-installation.spec.ts` to cover the scenarios.
* `historicalDataEnabled: boolean` option is supported in all the packages. If the options is set to true, the InstallationStore stores all the histories of installations. If the value is false, it maintains only the latest data by updating them. For deletion in the case of token revocation and uninstallations, all the associated data must be deleted regardless of the mode.
* The callbacks `onFetchInstallation`, `onStoreInstallation`, and `onDeleteInstallation` are supported in all the packages. These callbacks enable developers to customize the data to be stored in a database (e.g., encrypting token values in database rows), append custom properties to the database row, and do extra logging for better system monitoring.
* `InstallationStore#close(): Promise<void>` method is supported in all the packages. This method is supposed to be used for safely disconnecting from a database and cleaning up the remaining resources.

### Open source license

All the packages in this repository are published in the npm package registry under the MIT open-source license.

### Maintainers Guide

#### Run all the unit tests

You can run all the unit tests ysung lerna command:

```bash
git clone git@github.com:seratch/slack-bolt-extensions.git
cd slack-bolt-extensions/
npm i
npx lerna bootstrap
npx lerna run test
```

When you work on a specific project, head to the package directory and use `npm` commands here:

```bash
cd slack-bolt-extensions/
npm i
npx lerna bootstrap
cd packages/bolt-prisma/
npm test
code . # Open the project in Visual Studio Code
```

#### Publish the packages

For publishing the packages, we always use `lerna publish` command.

```bash
npx lerna bootstrap
npx lerna publish
# Follow the interactive steps with lerna
```
