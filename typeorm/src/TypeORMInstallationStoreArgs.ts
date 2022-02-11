import { Connection, EntityTarget } from 'typeorm';
import InstallationEntity from './InstallationEntity';

export default interface TypeORMInstallationStoreArgs {
  /**
   * TypeORM database connection
   */
  connection: Connection;

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
   * Stores all the installation data if true. The default is true.
   */
  historicalDataEnabled?: boolean;
}
