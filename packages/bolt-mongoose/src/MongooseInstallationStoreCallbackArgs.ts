import { Logger } from '@slack/logger';
import { Installation, InstallationQuery } from '@slack/oauth';

export interface StoreInstallationCallbackArgs {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entity: any;
  installation: Installation;
  logger: Logger;
  query?: InstallationQuery<boolean>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  idToUpdate?: any;
}

export interface FetchInstallationCallbackArgs {
  installation?: Installation;
  logger: Logger;
  query: InstallationQuery<boolean>;
}

export interface DeleteInstallationCallbackArgs {
  logger: Logger;
  query: InstallationQuery<boolean>;
}
