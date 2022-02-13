import { Logger } from '@slack/logger';
import { Installation, InstallationQuery } from '@slack/oauth';

export interface StoreInstallationCallbackArgs {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prismaInput: any;
  installation: Installation;
  logger: Logger;
  query?: InstallationQuery<boolean>;
  idToUpdate?: number | string;
}

export interface FetchInstallationCallbackArgs {
  installation: Installation;
  logger: Logger;
  query: InstallationQuery<boolean>;
}
