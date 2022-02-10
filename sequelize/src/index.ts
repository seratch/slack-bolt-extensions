import {
  Installation,
  InstallationQuery,
  InstallationStore,
  Logger,
} from '@slack/oauth';

import { Sequelize, Model, DataTypes } from 'sequelize';

export class SlackAppInstallation extends Model {
  public id?: number;

  public appId?: string;

  public enterpriseId?: string;

  public enterpriseName?: string;

  public enterpriseUrl?: string;

  public teamId?: string;

  public teamName?: string;

  public botToken?: string;

  public botId?: string;

  public botUserId?: string;

  public botScopes?: string;

  public botRefreshToken?: string;

  public botTokenExpiresAt?: Date;

  public userId?: string;

  public userToken?: string;

  public userScopes?: string;

  public userRefreshToken?: string;

  public userTokenExpiresAt?: Date;

  public incomingWebhookUrl?: string;

  public incomingWebhookChannel?: string;

  public incomingWebhookChannelId?: string;

  public incomingWebhookConfigurationUrl?: string;

  public isEnterpriseInstall?: boolean;

  public tokenType?: string;

  public installedAt?: Date;
}

export interface SequelizeInstallationStoreArgs {
  sequelize: Sequelize;
}

export class SequelizeInstallationStore implements InstallationStore {
  private sequelize: Sequelize;

  public constructor(options: SequelizeInstallationStoreArgs) {
    this.sequelize = options.sequelize;
    SlackAppInstallation.init(
      {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        appId: { type: DataTypes.STRING, allowNull: false },
        enterpriseId: { type: DataTypes.STRING, allowNull: true },
        enterpriseName: { type: DataTypes.STRING, allowNull: true },
        enterpriseUrl: { type: DataTypes.STRING, allowNull: true },
        teamId: { type: DataTypes.STRING, allowNull: true },
        teamName: { type: DataTypes.STRING, allowNull: true },
        botToken: { type: DataTypes.STRING, allowNull: true },
        botId: { type: DataTypes.STRING, allowNull: true },
        botUserId: { type: DataTypes.STRING, allowNull: true },
        botScopes: { type: DataTypes.STRING, allowNull: true },
        botRefreshToken: { type: DataTypes.STRING, allowNull: true },
        botTokenExpiresAt: { type: DataTypes.DATE, allowNull: true },
        userId: { type: DataTypes.STRING, allowNull: false },
        userToken: { type: DataTypes.STRING, allowNull: true },
        userScopes: { type: DataTypes.STRING, allowNull: true },
        userRefreshToken: { type: DataTypes.STRING, allowNull: true },
        userTokenExpiresAt: { type: DataTypes.DATE, allowNull: true },
        incomingWebhookUrl: { type: DataTypes.STRING, allowNull: true },
        incomingWebhookChannel: { type: DataTypes.STRING, allowNull: true },
        incomingWebhookChannelId: { type: DataTypes.STRING, allowNull: true },
        incomingWebhookConfigurationUrl: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        isEnterpriseInstall: { type: DataTypes.BOOLEAN, allowNull: false },
        tokenType: { type: DataTypes.STRING, allowNull: true },
        installedAt: { type: DataTypes.DATE, allowNull: false },
      },
      { sequelize: this.sequelize, modelName: 'slack_app_installation' },
    );
  }

  public async storeInstallation<AuthVersion extends 'v1' | 'v2'>(
    i: Installation<AuthVersion, boolean>,
    logger?: Logger,
  ): Promise<void> {
    const enterpriseId = i.enterprise?.id;
    const teamId = i.team?.id;
    const userId = i.user.id;
    const commonLogPart = `(enterprise_id: ${enterpriseId}, team_id: ${teamId}, user_id: ${userId})`;
    logger?.debug(`#storeInstallation starts ${commonLogPart}`);

    await this.sequelize.sync();

    await SlackAppInstallation.create({
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
    });
    logger?.debug(`#storeInstallation successfully completed ${commonLogPart}`);
  }

  public async fetchInstallation(
    query: InstallationQuery<boolean>,
    logger?: Logger,
  ): Promise<Installation<'v1' | 'v2', boolean>> {
    const { enterpriseId } = query;
    const { teamId } = query;
    const { userId } = query;
    const commonLogPart = `(enterprise_id: ${enterpriseId}, team_id: ${teamId}, user_id: ${userId})`;
    logger?.debug(`#fetchInstallation starts ${commonLogPart}`);

    await this.sequelize.sync();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = SequelizeInstallationStore.buildBaseWhereClause(query);
    const row = await SlackAppInstallation.findOne({
      where,
      order: [['installedAt', 'DESC']],
      limit: 1,
    });
    if (row) {
      logger?.debug(
        `#fetchInstallation found the installation data ${commonLogPart}`,
      );
      return {
        team: row.teamId ?
          {
            id: row.teamId,
            name: row.teamName,
          } :
          undefined,
        enterprise: row.enterpriseId ?
          {
            id: row.enterpriseId,
            name: row.enterpriseName,
          } :
          undefined,
        enterpriseUrl: row.enterpriseUrl,
        user: {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          id: row.userId!,
          token: row.userToken,
          refreshToken: row.userRefreshToken,
          expiresAt: row.userTokenExpiresAt?.getTime(),
          scopes: row.userScopes?.split(','),
        },
        bot:
          row.botId && row.botUserId && row.botToken ?
            {
              id: row.botId,
              userId: row.botUserId,
              token: row.botToken,
              refreshToken: row.botRefreshToken,
              expiresAt: row.botTokenExpiresAt?.getTime(),
              scopes: row.botScopes?.split(',') || [],
            } :
            undefined,
        incomingWebhook: row.incomingWebhookUrl ?
          {
            url: row.incomingWebhookUrl,
            channel: row.incomingWebhookChannel,
            channelId: row.incomingWebhookChannelId,
            configurationUrl: row.incomingWebhookConfigurationUrl,
          } :
          undefined,
        appId: row.appId,
        tokenType: 'bot', // TODO: user type is not yet supported in TS
        isEnterpriseInstall: row.isEnterpriseInstall,
        authVersion: 'v2', // This module does not support v1 installations
      };
    }
    logger?.debug(
      `#fetchInstallation didn't return any installation data ${commonLogPart}`,
    );
    throw new Error(`No installation data found ${commonLogPart}`);
  }

  public async deleteInstallation(
    query: InstallationQuery<boolean>,
    logger?: Logger,
  ): Promise<void> {
    const { enterpriseId } = query;
    const { teamId } = query;
    const { userId } = query;
    const commonLogPart = `(enterprise_id: ${enterpriseId}, team_id: ${teamId}, user_id: ${userId})`;
    logger?.debug(`#deleteInstallation starts ${commonLogPart}`);

    await this.sequelize.sync();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = SequelizeInstallationStore.buildBaseWhereClause(query);
    const deletionCount = await SlackAppInstallation.destroy({ where });
    logger?.debug(
      `#deleteInstallation deleted ${deletionCount} rows ${commonLogPart}`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static buildBaseWhereClause(query: InstallationQuery<boolean>): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (query.enterpriseId) {
      where.enterpriseId = query.enterpriseId;
    }
    if (query.teamId) {
      where.teamId = query.teamId;
    }
    if (query.userId) {
      where.userId = query.userId;
    }
    return where;
  }
}
