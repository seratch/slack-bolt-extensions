import { Logger } from '@slack/logger';
import { Installation, InstallationQuery } from '@slack/oauth';
import SlackAppInstallation from './SlackAppInstallation';

export interface StoreInstallationCallbackArgs<M extends SlackAppInstallation> {
  model: M;
  installation: Installation;
  logger: Logger;
  query?: InstallationQuery<boolean>;
}

export interface FetchInstallationCallbackArgs<M extends SlackAppInstallation> {
  query: InstallationQuery<boolean>;
  model: M;
  installation: Installation;
  logger: Logger;
}

export interface DeleteInstallationCallbackArgs {
  query: InstallationQuery<boolean>;
  logger: Logger;
}
