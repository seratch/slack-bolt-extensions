import { PrismaClient } from '@prisma/client';
import { Logger } from '@slack/logger';

import { DeleteInstallationCallbackArgs, FetchInstallationCallbackArgs, StoreInstallationCallbackArgs } from './PrismaInstallationStoreCallbackArgs';

export default interface PrismaInstallationStoreArgs {

  /**
   * Pass the database table referenece for managing installations.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prismaTable: any,

  /**
   * If you use #close() method to disconnect from the database server,
   * pass this option.
   */
  prismaClient?: PrismaClient, // for #close() method

  /**
   * For managing multiple Slack apps in a single database table
   */
  clientId?: string;

  /**
    * Stores all the installation data if true. The default value is true.
    */
  historicalDataEnabled?: boolean;

  /**
   * Callback for #storeInstallation()
   */
  onStoreInstallation?: (args: StoreInstallationCallbackArgs) => Promise<void>;

  /**
    * Callback for #fetchInstallation()
    */
  onFetchInstallation?: (args: FetchInstallationCallbackArgs) => Promise<void>;

  /**
    * Callback for #deleteInstallation()
    */
  onDeleteInstallation?: (
    args: DeleteInstallationCallbackArgs
  ) => Promise<void>;

  /**
   * Logger for this module's internal logs.
   */
  logger?: Logger,
}
