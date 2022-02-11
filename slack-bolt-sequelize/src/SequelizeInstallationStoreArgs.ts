import { Logger } from '@slack/logger';
import { Installation } from '@slack/oauth';
import { Sequelize } from 'sequelize';
import SlackAppInstallation from './SlackAppInstallation';

export default interface SequelizeInstallationStoreArgs {
  sequelize: Sequelize;
  clientId?: string;
  model?: typeof SlackAppInstallation;
  historicalDataEnabled?: boolean;
  onStoreInstallation?: <M extends SlackAppInstallation> (model: M, installation: Installation) => Promise<void>;
  onFetchInstallation?: <M extends SlackAppInstallation> (model: M, installation: Installation) => Promise<void>;
  logger?: Logger,
}
