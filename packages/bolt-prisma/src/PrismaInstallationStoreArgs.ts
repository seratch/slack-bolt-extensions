import { PrismaClient } from '@prisma/client';
import { Logger } from '@slack/logger';

import { FetchInstallationCallbackArgs, StoreInstallationCallbackArgs } from './PrismaInstallationStoreCallbackArgs';

export default interface PrismaInstallationStoreArgs {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prismaTable: any,
  prismaClient?: PrismaClient, // for #close() method
  clientId?: string;
  historicalDataEnabled?: boolean;
  onFetchInstallation?: (args: FetchInstallationCallbackArgs) => Promise<void>;
  onStoreInstallation?: (args: StoreInstallationCallbackArgs) => Promise<void>;
  logger?: Logger,
}
