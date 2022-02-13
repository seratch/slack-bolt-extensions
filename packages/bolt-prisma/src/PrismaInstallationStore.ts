/* eslint-disable import/prefer-default-export */

import { PrismaClient } from '@prisma/client';
import { ConsoleLogger } from '@slack/logger';
import {
  Installation,
  InstallationQuery,
  InstallationStore,
  Logger,
} from '@slack/oauth';

import PrismaInstallationStoreArgs from './PrismaInstallationStoreArgs';
import { StoreInstallationCallbackArgs, FetchInstallationCallbackArgs } from './PrismaInstallationStoreCallbackArgs';

export default class PrismaInstallationStore implements InstallationStore {
  private prismaClient?: PrismaClient;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private prismaTable: any;

  private clientId?: string;

  private logger: Logger;

  private historicalDataEnabled: boolean;

  private onFetchInstallation: (args: FetchInstallationCallbackArgs) => Promise<void>;

  private onStoreInstallation: (args: StoreInstallationCallbackArgs) => Promise<void>;

  public constructor(options: PrismaInstallationStoreArgs) {
    this.prismaClient = options.prismaClient;
    this.prismaTable = options.prismaTable;
    this.clientId = options.clientId;
    this.logger = options.logger !== undefined ?
      options.logger : new ConsoleLogger();
    this.historicalDataEnabled = options.historicalDataEnabled !== undefined ?
      options.historicalDataEnabled : true;
    this.onFetchInstallation = options.onFetchInstallation !== undefined ?
      options.onFetchInstallation : async (_) => {};
    this.onStoreInstallation = options.onStoreInstallation !== undefined ?
      options.onStoreInstallation : async (_) => {};

    this.logger.debug(`PrismaInstallationStore has been initialized (clientId: ${this.clientId})`);
  }

  // eslint-disable-next-line class-methods-use-this
  public async storeInstallation<AuthVersion extends 'v1' | 'v2'>(
    i: Installation<AuthVersion, boolean>,
    logger?: Logger,
  ): Promise<void> {
    const enterpriseId = i.enterprise?.id;
    const teamId = i.team?.id;
    const userId = i.user.id;
    const isEnterpriseInstall = i.isEnterpriseInstall || false;
    const commonLogPart = `(enterprise_id: ${enterpriseId}, team_id: ${teamId}, user_id: ${userId})`;
    logger?.debug(`#storeInstallation starts ${commonLogPart}`);

    const entity = {
      clientId: this.clientId,
      appId: i.appId,
      enterpriseId: i.enterprise?.id,
      enterpriseName: i.enterprise?.name,
      enterpriseUrl: i.enterpriseUrl,
      teamId: i.team?.id,
      teamName: i.team?.name,
      botToken: i.bot?.token,
      botId: i.bot?.id,
      botUserId: i.bot?.userId,
      botScopes: i.bot?.scopes?.join(','),
      botRefreshToken: i.bot?.refreshToken,
      botTokenExpiresAt: i.bot?.expiresAt ?
        new Date(i.bot.expiresAt as number * 1000) :
        undefined,
      userId: i.user.id,
      userToken: i.user.token,
      userScopes: i.user.scopes?.join(','),
      userRefreshToken: i.user.refreshToken,
      userTokenExpiresAt: i.user?.expiresAt ?
        new Date(i.user.expiresAt as number * 1000) :
        undefined,
      incomingWebhookUrl: i.incomingWebhook?.url,
      incomingWebhookChannel: i.incomingWebhook?.channel,
      incomingWebhookChannelId: i.incomingWebhook?.channelId,
      incomingWebhookConfigurationUrl: i.incomingWebhook?.configurationUrl,
      isEnterpriseInstall: i.isEnterpriseInstall,
      tokenType: i.tokenType,
      installedAt: new Date(),
    };

    if (this.historicalDataEnabled) {
      await this.onStoreInstallation({
        prismaInput: entity,
        installation: i,
        logger: this.logger,
      });
      await this.prismaTable.create({ data: entity });
    } else {
      const where = this.buildFullWhereClause({
        enterpriseId,
        teamId,
        userId,
        isEnterpriseInstall,
      });
      const existingRow = await this.prismaTable.findFirst({
        where,
        select: { id: true },
      });
      await this.onStoreInstallation({
        prismaInput: entity,
        installation: i,
        logger: this.logger,
        query: where,
        idToUpdate: existingRow?.id,
      });
      if (existingRow) {
        await this.prismaTable.update({ data: entity, where: { id: existingRow.id } });
      } else {
        await this.prismaTable.create({ data: entity });
      }
    }
    logger?.debug(`#storeInstallation successfully completed ${commonLogPart}`);
  }

  // eslint-disable-next-line class-methods-use-this
  public async fetchInstallation(
    query: InstallationQuery<boolean>,
    logger?: Logger,
  ): Promise<Installation<'v1' | 'v2', boolean>> {
    const { enterpriseId, teamId, userId } = query;
    const commonLogPart = `(enterprise_id: ${enterpriseId}, team_id: ${teamId}, user_id: ${userId})`;
    logger?.debug(`#fetchInstallation starts ${commonLogPart}`);

    let row = await this.prismaTable.findFirst({
      where: this.buildFullWhereClause(query),
      orderBy: [{ id: 'desc' }],
      take: 1,
    });
    if (query.userId !== undefined) {
      // Fetch the latest bot data in the table
      const botRow = await this.prismaTable.findFirst({
        where: this.buildBotQuery(query),
        orderBy: [{ id: 'desc' }],
        take: 1,
      });
      if (botRow && botRow.botId) {
        if (row) {
          row.botId = botRow.botId;
          row.botRefreshToken = botRow.botRefreshToken;
          row.botScopes = botRow.botScopes;
          row.botToken = botRow.botToken;
          row.botTokenExpiresAt = botRow.botTokenExpiresAt;
          row.botUserId = botRow.botUserId;
        } else {
          row = botRow;
        }
      }
    }
    if (row !== null) {
      logger?.debug(
        `#fetchInstallation found the installation data ${commonLogPart}`,
      );
      const installation: Installation = {
        team: row.teamId ?
          {
            id: row.teamId,
            name: row.teamName || undefined,
          } :
          undefined,
        enterprise: row.enterpriseId ?
          {
            id: row.enterpriseId,
            name: row.enterpriseName || undefined,
          } :
          undefined,
        enterpriseUrl: row.enterpriseUrl || undefined,
        user: {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          id: row.userId!,
          token: row.userToken || undefined,
          refreshToken: row.userRefreshToken || undefined,
          expiresAt: row.userTokenExpiresAt ? Math.floor(row.userTokenExpiresAt.getTime() / 1000) : undefined,
          scopes: row.userScopes?.split(','),
        },
        bot:
            row.botId && row.botUserId && row.botToken ?
              {
                id: row.botId,
                userId: row.botUserId,
                token: row.botToken,
                refreshToken: row.botRefreshToken || undefined,
                expiresAt: row.botTokenExpiresAt ? Math.floor(row.botTokenExpiresAt.getTime() / 1000) : undefined,
                scopes: row.botScopes?.split(',') || [],
              } :
              undefined,
        incomingWebhook: row.incomingWebhookUrl ?
          {
            url: row.incomingWebhookUrl,
            channel: row.incomingWebhookChannel || undefined,
            channelId: row.incomingWebhookChannelId || undefined,
            configurationUrl: row.incomingWebhookConfigurationUrl || undefined,
          } :
          undefined,
        appId: row.appId || undefined,
        tokenType: 'bot', // TODO: user type is not yet supported in TS
        isEnterpriseInstall: row.isEnterpriseInstall,
        authVersion: 'v2', // This module does not support v1 installations
      };
      await this.onFetchInstallation({
        query,
        installation,
        logger: this.logger,
      });
      return installation;
    }

    logger?.debug(
      `#fetchInstallation didn't return any installation data ${commonLogPart}`,
    );
    throw new Error(`No installation data found ${commonLogPart}`);
  }

  // eslint-disable-next-line class-methods-use-this
  public async deleteInstallation(
    query: InstallationQuery<boolean>,
    logger?: Logger,
  ): Promise<void> {
    const { enterpriseId, teamId, userId } = query;
    const commonLogPart = `(enterprise_id: ${enterpriseId}, team_id: ${teamId}, user_id: ${userId})`;
    logger?.debug(`#deleteInstallation starts ${commonLogPart}`);

    const deleted = await this.prismaTable.deleteMany({
      where: this.buildFullWhereClause(query),
    });

    logger?.debug(
      `#deleteInstallation deleted ${deleted.count} rows ${commonLogPart}`,
    );
  }

  // eslint-disable-next-line class-methods-use-this
  public async close(): Promise<void> {
    await this.prismaClient?.$disconnect();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildBotQuery(query: InstallationQuery<boolean>): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = this.buildFullWhereClause(query);
    // No userId here
    delete where.userId;
    return where;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildFullWhereClause(query: InstallationQuery<boolean>): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (this.clientId !== undefined) {
      where.clientId = this.clientId;
    } else {
      where.clientId = null;
    }
    if (query.enterpriseId !== undefined) {
      where.enterpriseId = query.enterpriseId;
    }
    if (query.isEnterpriseInstall) {
      where.teamId = null;
    } else if (query.teamId !== undefined) {
      where.teamId = query.teamId;
    }
    if (query.userId !== undefined) {
      where.userId = query.userId;
    }
    return where;
  }
}
