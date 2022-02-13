import { Logger } from '@slack/logger';
import { Mongoose } from 'mongoose';

export default interface MongooseInstallationStoreArgs {
  mongoose: Mongoose;
  clientId?: string;
  historicalDataEnabled?: boolean;
  logger?: Logger,
}
