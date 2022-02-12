import { Installation } from '@slack/oauth';

export function buildOrgWideInstallation(tokenExpiresAt: number): Installation<'v2', true> {
  return {
    team: undefined,
    enterprise: {
      id: 'test-enterprise-id',
      name: 'test-enterprise-name',
    },
    bot: {
      token: 'xoxb-xxx',
      scopes: ['commands', 'chat:write'],
      id: 'test-bot-id',
      userId: 'test-bot-user-id',
      refreshToken: 'xoxe-1-xxx',
      expiresAt: tokenExpiresAt,
    },
    user: {
      token: 'xoxp-yyy',
      id: 'test-user-id-1',
      scopes: ['search:read'],
      refreshToken: 'xoxe-1-yyy',
      expiresAt: tokenExpiresAt,
    },
    incomingWebhook: {
      url: 'https://www.example.com/webhooks/xxx',
      channel: 'channel name',
      channelId: 'channel ID',
      configurationUrl: 'https://www.example.com/webhooks/configuration/xxx',
    },
    appId: 'test-app-id',
    isEnterpriseInstall: true,
  };
}

export function buildTeamInstallation(tokenExpiresAt: number): Installation<'v2', false> {
  return {
    team: {
      id: 'test-team-id',
      name: 'team-team-name',
    },
    enterprise: {
      id: 'test-enterprise-id',
      name: 'test-enterprise-name',
    },
    bot: {
      token: 'xoxb-xxx',
      scopes: ['commands', 'chat:write'],
      id: 'test-bot-id',
      userId: 'test-bot-user-id',
      refreshToken: 'xoxe-1-xxx',
      expiresAt: tokenExpiresAt,
    },
    user: {
      token: 'xoxp-yyy',
      id: 'test-user-id-1',
      scopes: ['search:read'],
      refreshToken: 'xoxe-1-yyy',
      expiresAt: tokenExpiresAt,
    },
    incomingWebhook: {
      url: 'https://www.example.com/webhooks/xxx',
      channel: 'channel name',
      channelId: 'channel ID',
      configurationUrl: 'https://www.example.com/webhooks/configuration/xxx',
    },
    appId: 'test-app-id',
    isEnterpriseInstall: false,
  };
}
