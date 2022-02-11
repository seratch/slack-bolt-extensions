/* eslint-disable import/prefer-default-export */

import { ConsoleLogger } from '@slack/logger';
import {
  Installation,
  InstallationQuery,
  InstallationStore,
  Logger,
} from '@slack/oauth';

import { Sequelize, DataTypes, Op } from 'sequelize';
import SequelizeInstallationStoreArgs from './SequelizeInstallationStoreArgs';
import SlackAppInstallation from './SlackAppInstallation';

export default class SequelizeInstallationStore implements InstallationStore {
  private sequelize: Sequelize;

  private clientId?: string;

  private logger: Logger;

  private historicalDataEnabled: boolean;

  private model: typeof SlackAppInstallation;

  public constructor(options: SequelizeInstallationStoreArgs) {
    this.sequelize = options.sequelize;
    this.clientId = options.clientId;
    this.logger = options.logger !== undefined ?
      options.logger : new ConsoleLogger();
    this.historicalDataEnabled = options.historicalDataEnabled !== undefined ?
      options.historicalDataEnabled : true;
    if (options.model !== undefined) {
      this.model = options.model;
    } else {
      this.model = SlackAppInstallation;
      this.model.init(
        {
          id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
          },
          clientId: { type: DataTypes.STRING, allowNull: true },
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
    this.logger.debug(`SequelizeInstallationStore has been initialized (clientId: ${this.clientId}, model: ${this.model})`);
  }

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

    await this.sequelize.sync();

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
    if (this.historicalDataEnabled) {
      await this.model.create(entity);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {};
      if (enterpriseId !== undefined) {
        where.enterpriseId = enterpriseId;
      }
      if (isEnterpriseInstall && teamId !== undefined) {
        where.teamId = teamId;
      }
      if (userId !== undefined) {
        where.userId = userId;
      }
      const [count] = await this.model.update(entity, { where });
      if (count === 0) {
        await this.model.create(entity);
      }
    }
    logger?.debug(`#storeInstallation successfully completed ${commonLogPart}`);
  }

  public async fetchInstallation(
    query: InstallationQuery<boolean>,
    logger?: Logger,
  ): Promise<Installation<'v1' | 'v2', boolean>> {
    const { enterpriseId, teamId, userId } = query;
    const commonLogPart = `(enterprise_id: ${enterpriseId}, team_id: ${teamId}, user_id: ${userId})`;
    logger?.debug(`#fetchInstallation starts ${commonLogPart}`);

    await this.sequelize.sync();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = this.buildBaseWhereClause(query);
    const row = await this.model.findOne({
      where,
      order: [['id', 'DESC']],
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
    const { enterpriseId, teamId, userId } = query;
    const commonLogPart = `(enterprise_id: ${enterpriseId}, team_id: ${teamId}, user_id: ${userId})`;
    logger?.debug(`#deleteInstallation starts ${commonLogPart}`);

    await this.sequelize.sync();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = this.buildBaseWhereClause(query);
    const deletionCount = await this.model.destroy({ where });
    logger?.debug(
      `#deleteInstallation deleted ${deletionCount} rows ${commonLogPart}`,
    );
  }

  // eslint-disable-next-line class-methods-use-this
  public async close(): Promise<void> {
    // TODO
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildBaseWhereClause(query: InstallationQuery<boolean>): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (this.clientId !== undefined) {
      where.clientId = this.clientId;
    } else {
      where.clientId = { [Op.eq]: null };
    }
    if (query.enterpriseId !== undefined) {
      where.enterpriseId = query.enterpriseId;
    }
    if (query.isEnterpriseInstall) {
      where.teamId = { [Op.eq]: null };
    } else if (query.teamId !== undefined) {
      where.teamId = query.teamId;
    }
    if (query.userId !== undefined) {
      where.userId = query.userId;
    }
    return where;
  }
}
