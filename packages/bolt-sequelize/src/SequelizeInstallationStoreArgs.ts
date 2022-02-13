import { Logger } from '@slack/logger';
import { Sequelize } from 'sequelize';
import SlackAppInstallation from './SlackAppInstallation';
import { DeleteInstallationCallbackArgs, FetchInstallationCallbackArgs, StoreInstallationCallbackArgs } from './SequelizeInstallationStoreCallbackArgs';

export default interface SequelizeInstallationStoreArgs<M extends SlackAppInstallation> {

  /**
   * Sequelize database client object.
   */
  sequelize: Sequelize;

  /**
   * The model for managing installations
   */
  model?: typeof SlackAppInstallation;

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
  onStoreInstallation?: (args: StoreInstallationCallbackArgs<M>) => Promise<void>;

  /**
   * Callback for #fetchInstallation()
   */
  onFetchInstallation?: (args: FetchInstallationCallbackArgs<M>) => Promise<void>;

  /**
   * Callback for #deleteInstallation()
   */
  onDeleteInstallation?: (args: DeleteInstallationCallbackArgs) => Promise<void>;

  /**
   * Logger for this module's internal logs.
   */
  logger?: Logger;
}
