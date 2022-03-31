import { Authorize, AuthorizeResult } from '@slack/bolt';
import { WebClient } from '@slack/web-api';

export function runAuthTestForBotToken(
  client: WebClient,
  authorization: Partial<AuthorizeResult> & { botToken: Required<AuthorizeResult>['botToken'] },
): Promise<{ botUserId: string; botId: string }> {
  return authorization.botUserId !== undefined && authorization.botId !== undefined ?
    Promise.resolve({ botUserId: authorization.botUserId, botId: authorization.botId }) :
    client.auth.test({ token: authorization.botToken }).then((result) => ({
      botUserId: result.user_id as string,
      botId: result.bot_id as string,
    }));
}

// the shortened type, which is supposed to be used only in this source file
type Authorization = Partial<AuthorizeResult> & {
  botToken: Required<AuthorizeResult>['botToken'],
};

export async function buildAuthorizeResult(
  isEnterpriseInstall: boolean,
  authTestResult: Promise<{ botUserId: string; botId: string }>,
  authorization: Authorization,
): Promise<AuthorizeResult> {
  return { isEnterpriseInstall, botToken: authorization.botToken, ...(await authTestResult) };
}

export function singleAuthorization(
  client: WebClient,
  authorization: Authorization,
  tokenVerificationEnabled: boolean,
): Authorize<boolean> {
  // As Authorize function has a reference to this local variable,
  // this local variable can behave as auth.test call result cache for the function
  let cachedAuthTestResult: Promise<{ botUserId: string; botId: string }>;
  if (tokenVerificationEnabled) {
    // call auth.test immediately
    cachedAuthTestResult = runAuthTestForBotToken(client, authorization);
    return async ({ isEnterpriseInstall }) => buildAuthorizeResult(
      isEnterpriseInstall,
      cachedAuthTestResult,
      authorization,
    );
  }
  return async ({ isEnterpriseInstall }) => {
    // hold off calling auth.test API until the first access to authorize function
    cachedAuthTestResult = runAuthTestForBotToken(client, authorization);
    return buildAuthorizeResult(isEnterpriseInstall, cachedAuthTestResult, authorization);
  };
}
