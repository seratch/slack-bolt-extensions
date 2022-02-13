import { Logger } from '@slack/logger';
import { Sequelize } from 'sequelize';
import SlackAppInstallation from './SlackAppInstallation';
import { DeleteInstallationStoreCallbackArgs, FetchInstallationStoreCallbackArgs, StoreInstallationStoreCallbackArgs } from './SequelizeInstallationStoreCallbackArgs';

export default interface SequelizeInstallationStoreArgs<M extends SlackAppInstallation> {
  sequelize: Sequelize;
  clientId?: string;
  model?: typeof SlackAppInstallation;
  historicalDataEnabled?: boolean;
  onStoreInstallation?: (args: StoreInstallationStoreCallbackArgs<M>) => Promise<void>;
  onFetchInstallation?: (args: FetchInstallationStoreCallbackArgs<M>) => Promise<void>;
  onDeleteInstallation?: (args: DeleteInstallationStoreCallbackArgs) => Promise<void>;
  logger?: Logger,
}
