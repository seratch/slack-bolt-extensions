import { Logger } from '@slack/logger';
import { Installation, InstallationQuery } from '@slack/oauth';
import InstallationEntity from './InstallationEntity';

export interface StoreInstallationStoreCallbackArgs<E extends InstallationEntity> {
  entity: E;
  installation: Installation;
  logger: Logger;
  query?: InstallationQuery<boolean>;
}

export interface FetchInstallationStoreCallbackArgs<E extends InstallationEntity> {
  query: InstallationQuery<boolean>;
  entity: E;
  installation: Installation;
  logger: Logger;
}

export interface DeleteInstallationStoreCallbackArgs {
  query: InstallationQuery<boolean>;
  logger: Logger;
}
