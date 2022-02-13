## ⚡ Bolt for JavaScript Extensions (WIP)

⚠️ **Important Notice** ⚠️ 
> This project is still work in progress, and may have bugs in it. If you would like to immediately reuse the code here for your production apps, please feel free to take any under the MIT license and maintain it on your own.

This project aims to provide the bolt-js `InstallationStore` implementations for widely used database libraries, databases, and cloud services.

At this moment, we support the following database libraries. To learn how to use these `InstallationStore` in your bolt-js apps, check `src/tests/bolt-example.ts`. You can run the app by `npm run bolt` in each package directory.

* [slack-bolt-prisma](packages/bolt-prisma) for [Prisma](https://www.prisma.io/) (RDB / MongoDB)
* [slack-bolt-mongoose](packages/bolt-mongoose) for [Mongoose](https://mongoosejs.com/) (MongoDB)
* [slack-bolt-sequelize](packages/bolt-sequelize) for [Sequelize](https://sequelize.org/) (RDB)
* [slack-bolt-typeorm](packages/bolt-typeorm) for [TypeROM](https://typeorm.io/) (RDB / MongoDB)
* bolt-amazon-s3 (_coming soon!_)
* bolt-aws-dynamodb (_coming soon!_)

For instance, if you go with Prisma, your Bolt app code will look like the one below:

```typescript
import { App } from '@slack/bolt';
import { PrismaClient } from '@prisma/client';
import { PrismaInstallationStore } from 'slack-bolt-prisma';

const installationStore = new PrismaInstallationStore({
  prismaClient: new PrismaClient(),
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

(async () => {
  await app.start();
  logger.info('⚡️ Bolt app is running!');
})();
```

If you go with any of other packages, just replacing the `installationStore` part works for you.

### Features

All the packages guarantee they work with great consideration for the following points:

* InstallationStore in any of these packages returns the latest bot token plus the latest user token (only when it exists) for a query (enterprise_id / team_id / user_id / is_enterprise_install).
* Org-wide installations are also properly supported. All the packages have a unit test named `src/tests/org-wide-installation.spec.ts` to cover the scenarios.
* `historicalDataEnabled: boolean` option is supported in all the packages. If the options is set to true, the InstallationStore stores all the histories of installations. If the value is false, it maintains only the latest data by updating them. For deletion in the case of token revocation and uninstallations, all the associated data must be deleted regardless of the mode.
* The callbacks `onFetchInstallation`, `onStoreInstallation`, and `onDeleteInstallation` are supported in all the packages. These callbacks enable developers to customize the data to be stored in a database (e.g., encrypting token values in database rows), append custom properties to the database row, and do extra logging for better system monitoring.
* `InstallationStore#close(): Promise<void>` method is supported in all the packages. This method is supposed to be used for safely disconnecting from a database and cleaning up the remaining resources.

### Open source license

All the packages in this repository are published in the npm package registry under the MIT open-source license.
