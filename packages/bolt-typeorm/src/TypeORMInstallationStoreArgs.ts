import { Logger } from '@slack/logger';
import { Connection, EntityTarget } from 'typeorm';
import InstallationEntity from './InstallationEntity';
import { DeleteInstallationCallbackArgs, FetchInstallationCallbackArgs, StoreInstallationCallbackArgs } from './TypeORMInstallationStoreCallbackArgs';

export default interface TypeORMInstallationStoreArgs<E extends InstallationEntity> {
  /**
   * TypeORM database connection provider
   */
  connectionProvider?: () => Promise<Connection>;

  /**
   * If true, the installation store holds a connection internally. The default value is true.
   */
  connectionCacheEnabled?: boolean;

  /**
   * TypeORM database connection
   */
  connection?: Connection;

  /**
   * Entity class instance factory, which is supposed be used for new data creation
   */
  entityFactory: () => InstallationEntity;

  /**
   * The EntityTarget to identify the corresponding repository
   */
  entityTarget: EntityTarget<InstallationEntity>;

  /**
   * For managing multiple Slack apps in a single database table
   */
  clientId?: string;

  /**
   * Stores all the installation data if true. The default value is true.
   */
  historicalDataEnabled?: boolean;

  /**
   * The property to sort the rows in #fetchInstallation method. The default value is "id".
   */
  sortPropertyName?: string;

  /**
   * Callback for #storeInstallation()
   */
  onStoreInstallation?: (args: StoreInstallationCallbackArgs<E>) => Promise<void>;

  /**
   * Callback for #fetchInstallation()
   */
  onFetchInstallation?: (args: FetchInstallationCallbackArgs<E>) => Promise<void>;

  /**
   * Callback for #deleteInstallation()
   */
  onDeleteInstallation?: (args: DeleteInstallationCallbackArgs) => Promise<void>;

  /**
   * Logger for this module's internal logs.
   */
  logger?: Logger;
}
