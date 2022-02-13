import { Logger } from '@slack/logger';
import { Mongoose, Schema } from 'mongoose';
import { FetchInstallationCallbackArgs, StoreInstallationCallbackArgs, DeleteInstallationCallbackArgs } from './MongooseInstallationStoreCallbackArgs';

export default interface MongooseInstallationStoreArgs {
  mongoose: Mongoose;
  clientId?: string;
  historicalDataEnabled?: boolean;
  searchColumnNameForApp?: string;
  searchColumnNameForUser?: string;
  mongooseSchema?: Schema;
  mongooseModelName?: string;
  onFetchInstallation?: (args: FetchInstallationCallbackArgs) => Promise<void>;
  onStoreInstallation?: (args: StoreInstallationCallbackArgs) => Promise<void>;
  onDeleteInstallation?: (args: DeleteInstallationCallbackArgs) => Promise<void>;
  logger?: Logger,
}
