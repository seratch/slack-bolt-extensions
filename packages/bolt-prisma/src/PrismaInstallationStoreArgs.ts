import { PrismaClient } from '@prisma/client';
import { Logger } from '@slack/logger';

export default interface PrismaInstallationStoreArgs {
  prismaClient: PrismaClient,
  clientId?: string;
  historicalDataEnabled?: boolean;
  logger?: Logger,
}
