import {
  InstallProviderOptions,
  InstallURLOptions,
  BufferedIncomingMessage,
  ReceiverDispatchErrorHandlerArgs,
  ReceiverProcessEventErrorHandlerArgs,
  ReceiverUnhandledRequestHandlerArgs,
} from '@slack/bolt';
import { Logger, LogLevel } from '@slack/logger';
import { FastifyInstance } from 'fastify';
import FastifyInstallerOptions from './FastifyInstallerOptions';

export default interface FastifyReceiverOptions {
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
  installerOptions?: FastifyInstallerOptions;
  fastify?: FastifyInstance;
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
