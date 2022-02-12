import { Logger } from '@slack/logger';
import { Sequelize } from 'sequelize';
import SlackAppInstallation from './SlackAppInstallation';
import SequelizeInstallationStoreCallbackArgs from './SequelizeInstallationStoreCallbackArgs';

export default interface SequelizeInstallationStoreArgs<M extends SlackAppInstallation> {
  sequelize: Sequelize;
  clientId?: string;
  model?: typeof SlackAppInstallation;
  historicalDataEnabled?: boolean;
  onStoreInstallation?: (
    args: SequelizeInstallationStoreCallbackArgs<M>
  ) => Promise<void>;
  onFetchInstallation?: (
    args: SequelizeInstallationStoreCallbackArgs<M>
  ) => Promise<void>;
  logger?: Logger,
}
