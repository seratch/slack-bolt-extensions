/* eslint-disable import/prefer-default-export */

import { ConsoleLogger } from '@slack/logger';
import {
  Installation,
  InstallationQuery,
  InstallationStore,
  Logger,
} from '@slack/oauth';

import { Sequelize, Op } from 'sequelize';
import SlackAppInstallation from './SlackAppInstallation';
import SequelizeInstallationStoreArgs from './SequelizeInstallationStoreArgs';
import { DeleteInstallationCallbackArgs, FetchInstallationCallbackArgs, StoreInstallationCallbackArgs } from './SequelizeInstallationStoreCallbackArgs';

export default class SequelizeInstallationStore<M extends SlackAppInstallation> implements InstallationStore {
  private sequelize: Sequelize;

  private clientId?: string;

  private logger: Logger;

  private historicalDataEnabled: boolean;

  private model: typeof SlackAppInstallation;

  private onStoreInstallation: (args: StoreInstallationCallbackArgs<M>) => Promise<void>;

  private onFetchInstallation: (args: FetchInstallationCallbackArgs<M>) => Promise<void>;

  private onDeleteInstallation: (args: DeleteInstallationCallbackArgs) => Promise<void>;

  public constructor(options: SequelizeInstallationStoreArgs<M>) {
    this.sequelize = options.sequelize;
    this.clientId = options.clientId;
    this.logger = options.logger !== undefined ?
      options.logger : new ConsoleLogger();
    this.historicalDataEnabled = options.historicalDataEnabled !== undefined ?
      options.historicalDataEnabled : true;
    if (options.model !== undefined) {
      // If you want to customize the model initialization,
      // you can do so before passing this options.model to this constructor.
      this.model = options.model;
    } else {
      this.model = SlackAppInstallation;
      this.model.init(
        SlackAppInstallation.buildNewModelAttributes(),
        { sequelize: this.sequelize, modelName: 'slack_app_installation' },
      );
    }
    this.onStoreInstallation = options.onStoreInstallation !== undefined ?
      options.onStoreInstallation : async (_) => {};
    this.onFetchInstallation = options.onFetchInstallation !== undefined ?
      options.onFetchInstallation : async (_) => {};
    this.onDeleteInstallation = options.onDeleteInstallation !== undefined ?
      options.onDeleteInstallation : async (_) => {};

    this.logger.debug(`SequelizeInstallationStore has been initialized (clientId: ${this.clientId}, model: ${this.model.name})`);
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
        model: entity as unknown as M,
        installation: i,
        logger: this.logger,
      });
      await this.model.create(entity);
    } else {
      const where = this.buildFullWhereClause({
        enterpriseId,
        teamId,
        userId,
        isEnterpriseInstall,
      });
      await this.onStoreInstallation({
        model: entity as unknown as M,
        installation: i,
        logger: this.logger,
        query: where,
      });
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

    // If query.userId is present, the latest user associated installation will be fetched
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = this.buildFullWhereClause(query);
    let row = await this.model.findOne({
      where,
      order: [['id', 'DESC']],
      limit: 1,
    });
    if (query.userId !== undefined) {
      // Fetch the latest bot data in the table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const botWhere: any = this.buildBotQuery(query);
      const botRow = await this.model.findOne({ where: botWhere, order: [['id', 'DESC']], limit: 1 });
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
    if (row) {
      logger?.debug(
        `#fetchInstallation found the installation data ${commonLogPart}`,
      );
      const installation: Installation = {
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
          expiresAt: row.userTokenExpiresAt ? Math.floor(row.userTokenExpiresAt.getTime() / 1000) : undefined,
          scopes: row.userScopes?.split(','),
        },
        bot:
            row.botId && row.botUserId && row.botToken ?
              {
                id: row.botId,
                userId: row.botUserId,
                token: row.botToken,
                refreshToken: row.botRefreshToken,
                expiresAt: row.botTokenExpiresAt ? Math.floor(row.botTokenExpiresAt.getTime() / 1000) : undefined,
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

      await this.onFetchInstallation({
        query,
        installation,
        model: row as unknown as M,
        logger: this.logger,
      });
      return installation;
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

    await this.onDeleteInstallation({
      query,
      logger: this.logger,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = this.buildFullWhereClause(query);
    const deletionCount = await this.model.destroy({ where });
    logger?.debug(
      `#deleteInstallation deleted ${deletionCount} rows ${commonLogPart}`,
    );
  }

  // eslint-disable-next-line class-methods-use-this
  public async close(): Promise<void> {
    await this.sequelize.close();
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
