import {
  InstallProviderOptions,
  InstallURLOptions,
  BufferedIncomingMessage,
  ReceiverDispatchErrorHandlerArgs,
  ReceiverProcessEventErrorHandlerArgs,
  ReceiverUnhandledRequestHandlerArgs,
} from '@slack/bolt';
import { Logger, LogLevel } from '@slack/logger';
import { WebClientOptions } from '@slack/web-api';
import InstallerOptions from './InstallerOptions';

export default interface AppRunnerOptions {
  signingSecret: string | (() => PromiseLike<string>);
  token?: string;
  webClientOptions?: WebClientOptions,
  logger?: Logger;
  logLevel?: LogLevel;
  signatureVerification?: boolean;
  processBeforeResponse?: boolean;
  clientId?: string;
  clientSecret?: string;
  stateSecret?: InstallProviderOptions['stateSecret']; // required when using default stateStore
  redirectUri?: string;
  installerOptions?: InstallerOptions;
  installationStore?: InstallProviderOptions['installationStore']; // default MemoryInstallationStore
  scopes?: InstallURLOptions['scopes'];
  customPropertiesExtractor?: (
    request: BufferedIncomingMessage
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => Record<string, any>;
  dispatchErrorHandler?: (args: ReceiverDispatchErrorHandlerArgs) => Promise<void>;
  processEventErrorHandler?: (
    args: ReceiverProcessEventErrorHandlerArgs
  ) => Promise<boolean>;
  // For the compatibility with HTTPResponseAck, this handler is not async
  unhandledRequestHandler?: (args: ReceiverUnhandledRequestHandlerArgs) => void;
  unhandledRequestTimeoutMillis?: number;
}
