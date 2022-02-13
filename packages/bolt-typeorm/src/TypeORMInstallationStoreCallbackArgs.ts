import { Logger } from '@slack/logger';
import { Installation, InstallationQuery } from '@slack/oauth';
import InstallationEntity from './InstallationEntity';

export interface StoreInstallationCallbackArgs<E extends InstallationEntity> {
  entity: E;
  installation: Installation;
  logger: Logger;
  query?: InstallationQuery<boolean>;
}

export interface FetchInstallationCallbackArgs<E extends InstallationEntity> {
  query: InstallationQuery<boolean>;
  entity: E;
  installation: Installation;
  logger: Logger;
}

export interface DeleteInstallationCallbackArgs {
  query: InstallationQuery<boolean>;
  logger: Logger;
}
