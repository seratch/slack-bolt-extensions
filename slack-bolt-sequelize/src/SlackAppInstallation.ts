/* eslint-disable import/prefer-default-export */

import { Model } from 'sequelize';

export default class SlackAppInstallation extends Model {
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
