import { Logger } from '@slack/logger';
import { Installation } from '@slack/oauth';
import { Connection, EntityTarget } from 'typeorm';
import InstallationEntity from './InstallationEntity';

export default interface TypeORMInstallationStoreArgs {
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
   * Custom field configurator, which is supposed be called in #storeInstallation
   */
  customEntityPropertyConfigurator?: <T extends InstallationEntity> (
    entity: T, installation: Installation) => Promise<void>,

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
   * Logger for the internal logs.
   */
  logger?: Logger;
}
