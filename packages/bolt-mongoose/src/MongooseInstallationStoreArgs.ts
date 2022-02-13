import { Logger } from '@slack/logger';
import { Mongoose, Schema } from 'mongoose';
import {
  FetchInstallationCallbackArgs,
  StoreInstallationCallbackArgs,
  DeleteInstallationCallbackArgs,
} from './MongooseInstallationStoreCallbackArgs';

export default interface MongooseInstallationStoreArgs {

  /**
   * Mongoose client
   */
  mongoose: Mongoose;

  /**
   * For managing multiple Slack apps in a single database table
   */
  clientId?: string;

  /**
   * Stores all the installation data if true. The default value is true.
   */
  historicalDataEnabled?: boolean;

  /**
   * The search column name for app
   */
  searchColumnNameForApp?: string;
  /**
   * The search column name for user
   */
  searchColumnNameForUser?: string;

  /**
   * Set this option if you would like to use your own schema.
   * searchColumnNameForApp and searchColumnNameForUser should be included
   * in the schema definition.
   */
  mongooseSchema?: Schema;

  /**
   * Set this option if you would like to use your own model name.
   */
  mongooseModelName?: string;
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
  onDeleteInstallation?: (args: DeleteInstallationCallbackArgs) => Promise<void>;

  /**
   * Logger for this module's internal logs.
   */
  logger?: Logger;
}
