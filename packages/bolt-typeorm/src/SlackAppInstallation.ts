/* eslint-disable import/prefer-default-export */

import { Attributes, DataTypes, Model, ModelAttributes, ModelStatic } from 'sequelize';

type M = InstanceType<ModelStatic<Model>>;

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

  public static buildNewModelAttributes(): ModelAttributes<M, Attributes<M>> {
    return {
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
    };
  }
}
