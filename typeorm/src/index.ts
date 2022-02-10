/* eslint-disable node/no-extraneous-import */
/* eslint-disable import/no-extraneous-dependencies */
import 'reflect-metadata';

import {
  Installation,
  InstallationQuery,
  InstallationStore,
  Logger,
} from '@slack/oauth';

import { Connection } from 'typeorm';
// eslint-disable-next-line import/no-internal-modules
import SlackAppInstallation from './entity/SlackAppInstallation';

export interface TypeORMInstallationStoreArgs {
  connection: Connection;
}

export class TypeORMInstallationStore implements InstallationStore {
  private connection: Connection;

  public constructor(options: TypeORMInstallationStoreArgs) {
    this.connection = options.connection;
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

    const newRow: SlackAppInstallation = new SlackAppInstallation();
    newRow.appId = i.appId;
    newRow.enterpriseId = i.enterprise?.id;
    newRow.enterpriseName = i.enterprise?.name;
    newRow.enterpriseUrl = i.enterpriseUrl;
    newRow.teamId = i.team?.id;
    newRow.teamName = i.team?.name;
    newRow.botToken = i.bot?.token;
    newRow.botId = i.bot?.id;
    newRow.botUserId = i.bot?.userId;
    newRow.botScopes = i.bot?.scopes?.join(';');
    newRow.botRefreshToken = i.bot?.refreshToken;
    newRow.botTokenExpiresAt = i.bot?.expiresAt ?
      new Date(i.bot.expiresAt) :
      undefined;
    newRow.userId = i.user.id;
    newRow.userToken = i.user.token;
    newRow.userScopes = i.user.scopes?.join(';');
    newRow.userRefreshToken = i.user.refreshToken;
    newRow.userTokenExpiresAt = i.user?.expiresAt ?
      new Date(i.user.expiresAt) :
      undefined;
    newRow.incomingWebhookUrl = i.incomingWebhook?.url;
    newRow.incomingWebhookChannel = i.incomingWebhook?.channel;
    newRow.incomingWebhookChannelId = i.incomingWebhook?.channelId;
    newRow.incomingWebhookConfigurationUrl = i.incomingWebhook?.configurationUrl;
    newRow.isEnterpriseInstall = i.isEnterpriseInstall;
    newRow.tokenType = i.tokenType || 'bot'; // TODO: fix
    newRow.installedAt = new Date();

    await this.connection.manager.save<SlackAppInstallation>(newRow);

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

    const row = await this.connection.manager
      .getRepository(SlackAppInstallation)
      .createQueryBuilder('i')
      .where([
        (enterpriseId ? 'i.enterpriseId = :enterpriseId' : undefined),
        (teamId ? 'i.teamId = :teamId' : undefined),
        (userId ? 'i.userId = :userId' : undefined),
      ].filter((a) => a !== undefined).join(' AND '))
      .setParameters({ enterpriseId, teamId, userId })
      .orderBy('installedAt', 'DESC')
      .limit(1)
      .getOne();

    if (row) {
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

    await this.connection.manager
      .getRepository(SlackAppInstallation)
      .createQueryBuilder()
      .delete()
      .where([
        (enterpriseId ? 'enterpriseId = :enterpriseId' : undefined),
        (teamId ? 'teamId = :teamId' : undefined),
        (userId ? 'userId = :userId' : undefined),
      ].filter((a) => a !== undefined).join(' AND '))
      .setParameters({ enterpriseId, teamId, userId })
      .execute();

    logger?.debug(
      `#deleteInstallation completed ${commonLogPart}`,
    );
  }
}
