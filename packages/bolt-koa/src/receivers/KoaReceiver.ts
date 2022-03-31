import { InstallProvider } from '@slack/oauth';
import { ConsoleLogger, Logger } from '@slack/logger';
import Router from '@koa/router';
import Koa from 'koa';
import { Server, createServer } from 'http';
import {
  App,
  CodedError,
  Receiver,
  ReceiverEvent,
  ReceiverInconsistentStateError,
  HTTPModuleFunctions as httpFunc,
  HTTPResponseAck,
  BufferedIncomingMessage,
  ReceiverDispatchErrorHandlerArgs,
  ReceiverProcessEventErrorHandlerArgs,
  ReceiverUnhandledRequestHandlerArgs,
} from '@slack/bolt';

import KoaInstallerOptions from './KoaInstallerOptions';
import KoaReceiverOptions from './KoaReceiverOptions';

export default class KoaReceiver implements Receiver {
  private app: App | undefined;

  private logger: Logger;

  private signingSecretProvider: string | (() => PromiseLike<string>);

  private signatureVerification: boolean;

  private processBeforeResponse: boolean;

  private path: string;

  private unhandledRequestTimeoutMillis: number;

  private customPropertiesExtractor: (
    request: BufferedIncomingMessage
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => Record<string, any>;

  private dispatchErrorHandler: (args: ReceiverDispatchErrorHandlerArgs) => Promise<void>;

  private processEventErrorHandler: (args: ReceiverProcessEventErrorHandlerArgs) => Promise<boolean>;

  private unhandledRequestHandler: (args: ReceiverUnhandledRequestHandlerArgs) => void;

  // ----------------------------

  private koa: Koa;

  private router: Router;

  private server: Server | undefined;

  private installer: InstallProvider | undefined;

  private installerOptions: KoaInstallerOptions | undefined;

  public constructor(options: KoaReceiverOptions) {
    this.signatureVerification = options.signatureVerification ?? true;
    this.signingSecretProvider = options.signingSecret;
    this.customPropertiesExtractor = options.customPropertiesExtractor !== undefined ?
      options.customPropertiesExtractor :
      (_) => ({});
    this.path = options.path ?? '/slack/events';
    this.unhandledRequestTimeoutMillis = options.unhandledRequestTimeoutMillis ?? 3001;

    this.koa = options.koa ?? new Koa();
    this.router = options.router ?? new Router();
    this.logger = options.logger ??
      (() => {
        const defaultLogger = new ConsoleLogger();
        if (options.logLevel) {
          defaultLogger.setLevel(options.logLevel);
        }
        return defaultLogger;
      })();
    this.processBeforeResponse = options.processBeforeResponse ?? false;
    this.dispatchErrorHandler = options.dispatchErrorHandler ?? httpFunc.defaultAsyncDispatchErrorHandler;
    this.processEventErrorHandler = options.processEventErrorHandler ?? httpFunc.defaultProcessEventErrorHandler;
    this.unhandledRequestHandler = options.unhandledRequestHandler ?? httpFunc.defaultUnhandledRequestHandler;

    this.installerOptions = options.installerOptions;
    if (
      this.installerOptions &&
      this.installerOptions.installPath === undefined
    ) {
      this.installerOptions.installPath = '/slack/install';
    }
    if (
      this.installerOptions &&
      this.installerOptions.redirectUriPath === undefined
    ) {
      this.installerOptions.redirectUriPath = '/slack/oauth_redirect';
    }
    if (options.clientId && options.clientSecret) {
      this.installer = new InstallProvider({
        ...this.installerOptions,
        clientId: options.clientId,
        clientSecret: options.clientSecret,
        stateSecret: options.stateSecret,
        installationStore: options.installationStore,
        logger: options.logger,
        logLevel: options.logLevel,
        installUrlOptions: {
          scopes: options.scopes ?? [],
          userScopes: this.installerOptions?.userScopes,
          metadata: this.installerOptions?.metadata,
          redirectUri: options.redirectUri,
        },
      });
    }
  }

  private _sigingSecret: string | undefined;

  private async signingSecret(): Promise<string> {
    if (this._sigingSecret === undefined) {
      this._sigingSecret = typeof this.signingSecretProvider === 'string' ?
        this.signingSecretProvider :
        await this.signingSecretProvider();
    }
    return this._sigingSecret;
  }

  public init(app: App): void {
    this.app = app;
    if (
      this.installer &&
      this.installerOptions &&
      this.installerOptions.installPath &&
      this.installerOptions.redirectUriPath
    ) {
      this.router.get(this.installerOptions.installPath, async (ctx) => {
        try {
          await this.installer?.handleInstallPath(
            ctx.req,
            ctx.res,
            this.installerOptions?.installPathOptions,
          );
        } catch (error) {
          await this.dispatchErrorHandler({
            error: error as Error | CodedError,
            logger: this.logger,
            request: ctx.req,
            response: ctx.res,
          });
        }
      });
      this.router.get(this.installerOptions.redirectUriPath, async (ctx) => {
        try {
          await this.installer?.handleCallback(
            ctx.req,
            ctx.res,
            this.installerOptions?.callbackOptions,
          );
        } catch (error) {
          await this.dispatchErrorHandler({
            error: error as Error | CodedError,
            logger: this.logger,
            request: ctx.req,
            response: ctx.res,
          });
        }
      });
    }

    this.router.post(this.path, async (ctx) => {
      const { req, res } = ctx;
      try {
        // Verify authenticity
        let bufferedReq: BufferedIncomingMessage;
        try {
          bufferedReq = await httpFunc.parseAndVerifyHTTPRequest(
            {
              // If enabled: false, this method returns bufferredReq without verification
              enabled: this.signatureVerification,
              signingSecret: await this.signingSecret(),
            },
            req,
          );
        } catch (err) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const e = err as any;
          if (this.signatureVerification) {
            this.logger.warn(`Failed to parse and verify the request data: ${e.message}`);
          } else {
            this.logger.warn(`Failed to parse the request body: ${e.message}`);
          }
          httpFunc.buildNoBodyResponse(res, 401);
          return;
        }

        // Parse request body
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let body: any;
        try {
          body = httpFunc.parseHTTPRequestBody(bufferedReq);
        } catch (err) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const e = err as any;
          this.logger.warn(`Malformed request body: ${e.message}`);
          httpFunc.buildNoBodyResponse(res, 400);
          return;
        }

        // Handle SSL checks
        if (body.ssl_check) {
          httpFunc.buildSSLCheckResponse(res);
          return;
        }

        // Handle URL verification
        if (body.type === 'url_verification') {
          httpFunc.buildUrlVerificationResponse(res, body);
          return;
        }

        const ack = new HTTPResponseAck({
          logger: this.logger,
          processBeforeResponse: this.processBeforeResponse,
          unhandledRequestHandler: this.unhandledRequestHandler,
          unhandledRequestTimeoutMillis: this.unhandledRequestTimeoutMillis,
          httpRequest: bufferedReq,
          httpResponse: res,
        });
        // Structure the ReceiverEvent
        const event: ReceiverEvent = {
          body,
          ack: ack.bind(),
          retryNum: httpFunc.extractRetryNumFromHTTPRequest(req),
          retryReason: httpFunc.extractRetryReasonFromHTTPRequest(req),
          customProperties: this.customPropertiesExtractor(bufferedReq),
        };

        // Send the event to the app for processing
        try {
          await this.app?.processEvent(event);
          if (ack.storedResponse !== undefined) {
            // in the case of processBeforeResponse: true
            httpFunc.buildContentResponse(res, ack.storedResponse);
            this.logger.debug('stored response sent');
          }
        } catch (error) {
          const acknowledgedByHandler = await this.processEventErrorHandler({
            error: error as Error | CodedError,
            logger: this.logger,
            request: req,
            response: res,
            storedResponse: ack.storedResponse,
          });
          if (acknowledgedByHandler) {
            // If the value is false, we don't touch the value as a race condition
            // with ack() call may occur especially when processBeforeResponse: false
            ack.ack();
          }
        }
      } catch (error) {
        await this.dispatchErrorHandler({
          error: error as Error | CodedError,
          logger: this.logger,
          request: req,
          response: res,
        });
      }
    });
  }

  public start(port: number = 3000): Promise<Server> {
    // Enable routes
    this.koa.use(this.router.routes()).use(this.router.allowedMethods());

    if (this.server !== undefined) {
      return Promise.reject(
        new ReceiverInconsistentStateError('The receiver cannot be started because it was already started.'),
      );
    }

    return new Promise((resolve, reject) => {
      this.server = createServer(this.koa.callback());
      this.server.on('error', (error) => {
        if (this.server) {
          this.server.close();
        }
        reject(error);
      });

      this.server.on('close', () => {
        this.server = undefined;
      });

      this.server.listen(port, () => {
        if (this.server === undefined) {
          return reject(new ReceiverInconsistentStateError('The HTTP server is unexpectedly missing'));
        }
        return resolve(this.server);
      });
    });
  }

  public stop(): Promise<void> {
    if (this.server === undefined) {
      const errorMessage = 'The receiver cannot be stopped because it was not started.';
      return Promise.reject(new ReceiverInconsistentStateError(errorMessage));
    }
    return new Promise((resolve, reject) => {
      this.server?.close((error) => {
        if (error !== undefined) {
          return reject(error);
        }

        this.server = undefined;
        return resolve();
      });
    });
  }
}
