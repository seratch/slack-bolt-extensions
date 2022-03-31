import {
  InstallProviderOptions,
  InstallURLOptions,
  BufferedIncomingMessage,
  ReceiverDispatchErrorHandlerArgs,
  ReceiverProcessEventErrorHandlerArgs,
  ReceiverUnhandledRequestHandlerArgs,
} from '@slack/bolt';
import { CallbackOptions, InstallPathOptions } from '@slack/oauth';
import { Logger, LogLevel } from '@slack/logger';
import Koa from 'koa';
import Router from '@koa/router';

export interface InstallerOptions {
  stateStore?: InstallProviderOptions['stateStore']; // default ClearStateStore
  stateVerification?: InstallProviderOptions['stateVerification']; // defaults true
  authVersion?: InstallProviderOptions['authVersion']; // default 'v2'
  metadata?: InstallURLOptions['metadata'];
  installPath?: string;
  directInstall?: boolean; // see https://api.slack.com/start/distributing/directory#direct_install
  renderHtmlForInstallPath?: (url: string) => string;
  redirectUriPath?: string;
  installPathOptions?: InstallPathOptions;
  callbackOptions?: CallbackOptions;
  userScopes?: InstallURLOptions['userScopes'];
  clientOptions?: InstallProviderOptions['clientOptions'];
  authorizationUrl?: InstallProviderOptions['authorizationUrl'];
}

export interface KoaReceiverOptions {
  signingSecret: string | (() => PromiseLike<string>);
  logger?: Logger;
  logLevel?: LogLevel;
  path?: string;
  signatureVerification?: boolean;
  processBeforeResponse?: boolean;
  clientId?: string;
  clientSecret?: string;
  stateSecret?: InstallProviderOptions['stateSecret']; // required when using default stateStore
  redirectUri?: string;
  installationStore?: InstallProviderOptions['installationStore']; // default MemoryInstallationStore
  scopes?: InstallURLOptions['scopes'];
  installerOptions?: InstallerOptions;
  koa: Koa;
  router: Router;
  customPropertiesExtractor?: (
    request: BufferedIncomingMessage
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => Record<string, any>;
  // NOTE: As http.RequestListener is not an async function, this cannot be async
  dispatchErrorHandler?: (args: ReceiverDispatchErrorHandlerArgs) => void;
  processEventErrorHandler?: (
    args: ReceiverProcessEventErrorHandlerArgs
  ) => Promise<boolean>;
  // NOTE: As we use setTimeout under the hood, this cannot be async
  unhandledRequestHandler?: (args: ReceiverUnhandledRequestHandlerArgs) => void;
  unhandledRequestTimeoutMillis?: number;
}
