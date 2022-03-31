import { InstallProvider } from '@slack/oauth';
import { ConsoleLogger, Logger } from '@slack/logger';
import { IncomingMessage, ServerResponse } from 'http';
import {
  App,
  CodedError,
  ReceiverEvent,
  HTTPModuleFunctions as httpFunc,
  HTTPResponseAck,
  BufferedIncomingMessage,
  ReceiverDispatchErrorHandlerArgs,
  ReceiverProcessEventErrorHandlerArgs,
  ReceiverUnhandledRequestHandlerArgs,
  Authorize,
  AppOptions,
} from '@slack/bolt';
import { WebClient } from '@slack/web-api';

import InstallerOptions from './InstallerOptions';
import AppRunnerOptions from './AppRunnerOptions';
import { singleAuthorization } from './internals';
import NOOPReceiver from './NOOPReceiver';

export default class AppRunner {
  private app: App | undefined;

  private token: string | undefined;

  private client: WebClient;

  private logger: Logger;

  private signingSecretProvider: string | (() => PromiseLike<string>);

  private signatureVerification: boolean;

  private processBeforeResponse: boolean;

  private unhandledRequestTimeoutMillis: number;

  private customPropertiesExtractor: (
    request: BufferedIncomingMessage
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => Record<string, any>;

  private dispatchErrorHandler: (args: ReceiverDispatchErrorHandlerArgs) => Promise<void>;

  private processEventErrorHandler: (args: ReceiverProcessEventErrorHandlerArgs) => Promise<boolean>;

  private unhandledRequestHandler: (args: ReceiverUnhandledRequestHandlerArgs) => void;

  // ----------------------------

  private installer: InstallProvider | undefined;

  private installerOptions: InstallerOptions | undefined;

  public constructor(options: AppRunnerOptions) {
    this.token = options.token;
    this.client = new WebClient(options.token, options.webClientOptions);
    this.signatureVerification = options.signatureVerification ?? true;
    this.signingSecretProvider = options.signingSecret;
    this.customPropertiesExtractor = options.customPropertiesExtractor !== undefined ?
      options.customPropertiesExtractor :
      (_) => ({});
    this.unhandledRequestTimeoutMillis = options.unhandledRequestTimeoutMillis ?? 3001;

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

  public authorize(): Authorize<boolean> {
    if (this.installer) {
      return this.installer.authorize;
    }
    if (this.token) {
      return singleAuthorization(this.client, { botToken: this.token }, false);
    }
    throw new Error('Either token or OAuth settings is required');
  }

  public appOptions(): AppOptions {
    return {
      authorize: this.authorize(),
      receiver: new NOOPReceiver(),
    };
  }

  public setup(app: App): void {
    this.app = app;
  }

  public async handleInstallPath(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      await this.installer?.handleInstallPath(
        req,
        res,
        this.installerOptions?.installPathOptions,
      );
    } catch (error) {
      await this.dispatchErrorHandler({
        error: error as Error | CodedError,
        logger: this.logger,
        request: req,
        response: res,
      });
    }
  }

  public async handleCallback(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      await this.installer?.handleCallback(
        req,
        res,
        this.installerOptions?.callbackOptions,
      );
    } catch (error) {
      await this.dispatchErrorHandler({
        error: error as Error | CodedError,
        logger: this.logger,
        request: req,
        response: res,
      });
    }
  }

  public async handleEvents(req: IncomingMessage, res: ServerResponse): Promise<void> {
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
  }
}
