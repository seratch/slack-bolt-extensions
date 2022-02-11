import { Logger } from '@slack/logger';
import { Sequelize } from 'sequelize';
import SlackAppInstallation from './SlackAppInstallation';

export default interface SequelizeInstallationStoreArgs {
  sequelize: Sequelize;
  clientId?: string;
  model?: typeof SlackAppInstallation;
  historicalDataEnabled?: boolean;
  logger?: Logger,
}
