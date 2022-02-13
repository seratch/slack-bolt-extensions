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

export default class PrismaInstallationStore implements InstallationStore {
  private prismaClient: PrismaClient;

  private clientId?: string;

  private logger: Logger;

  private historicalDataEnabled: boolean;

  public constructor(options: PrismaInstallationStoreArgs) {
    this.prismaClient = options.prismaClient;
    this.clientId = options.clientId;
    this.logger = options.logger !== undefined ?
      options.logger : new ConsoleLogger();
    this.historicalDataEnabled = options.historicalDataEnabled !== undefined ?
      options.historicalDataEnabled : true;
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
        new Date(i.bot.expiresAt) :
        undefined,
      userId: i.user.id,
      userToken: i.user.token,
      userScopes: i.user.scopes?.join(','),
      userRefreshToken: i.user.refreshToken,
      userTokenExpiresAt: i.user?.expiresAt ?
        new Date(i.user.expiresAt) :
        undefined,
      incomingWebhookUrl: i.incomingWebhook?.url,
      incomingWebhookChannel: i.incomingWebhook?.channel,
      incomingWebhookChannelId: i.incomingWebhook?.channelId,
      incomingWebhookConfigurationUrl: i.incomingWebhook?.configurationUrl,
      isEnterpriseInstall: i.isEnterpriseInstall,
      tokenType: i.tokenType,
      installedAt: new Date(),
    };

    // TODO

    const table = this.prismaClient.slackAppInstallation;
    if (this.historicalDataEnabled) {
      await table.create({ data: entity });
    } else {
      const existingRow = await this.prismaClient.slackAppInstallation.findFirst({
        where: this.buildFullWhereClause({
          enterpriseId,
          teamId,
          userId,
          isEnterpriseInstall,
        }),
        select: { id: true },
      });
      if (existingRow) {
        await table.update({ data: entity, where: { id: existingRow.id } });
      } else {
        await table.create({ data: entity });
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

    let row = await this.prismaClient.slackAppInstallation.findFirst({
      where: this.buildFullWhereClause(query),
      orderBy: [{ id: 'desc' }],
      take: 1,
    });
    if (query.userId !== undefined) {
      // Fetch the latest bot data in the table
      const botRow = await this.prismaClient.slackAppInstallation.findFirst({
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
          expiresAt: row.userTokenExpiresAt?.getTime(),
          scopes: row.userScopes?.split(','),
        },
        bot:
            row.botId && row.botUserId && row.botToken ?
              {
                id: row.botId,
                userId: row.botUserId,
                token: row.botToken,
                refreshToken: row.botRefreshToken || undefined,
                expiresAt: row.botTokenExpiresAt?.getTime(),
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
      // TODO
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

    const deleted = await this.prismaClient.slackAppInstallation.deleteMany({
      where: this.buildFullWhereClause(query),
    });

    logger?.debug(
      `#deleteInstallation deleted ${deleted.count} rows ${commonLogPart}`,
    );
  }

  // eslint-disable-next-line class-methods-use-this
  public async close(): Promise<void> {
    await this.prismaClient.$disconnect();
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
