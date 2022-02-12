import { Logger } from '@slack/logger';
import { Installation, InstallationQuery } from '@slack/oauth';
import SlackAppInstallation from './SlackAppInstallation';

export default interface SequelizeInstallationStoreCallbackArgs<M extends SlackAppInstallation> {
  model: M;
  installation: Installation;
  logger: Logger,
  query?: InstallationQuery<boolean>;
}
