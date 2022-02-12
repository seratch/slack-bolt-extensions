export default interface InstallationEntity {
  id?: number;
  clientId?: string;
  appId?: string;
  enterpriseId?: string;
  enterpriseName?: string;
  enterpriseUrl?: string;
  teamId?: string;
  teamName?: string;
  botToken?: string;
  botId?: string;
  botUserId?: string;
  botScopes?: string;
  botRefreshToken?: string;
  botTokenExpiresAt?: Date;
  userId?: string;
  userToken?: string;
  userScopes?: string;
  userRefreshToken?: string;
  userTokenExpiresAt?: Date;
  incomingWebhookUrl?: string;
  incomingWebhookChannel?: string;
  incomingWebhookChannelId?: string;
  incomingWebhookConfigurationUrl?: string;
  isEnterpriseInstall?: boolean;
  tokenType?: string;
  installedAt?: Date;
}
