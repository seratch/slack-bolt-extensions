import { App, CodedError, ErrorCode, Receiver, ReceiverEvent, ReceiverInconsistentStateError, ReceiverMultipleAckError } from '@slack/bolt';
import { InstallProvider } from '@slack/oauth';
import { Logger } from '@slack/logger';
import Router from '@koa/router';
import Koa from 'koa';
import { Server } from 'http';
import { InstallerOptions, KoaReceiverOptions } from './KoaReceiverOptions';
import {
  BufferedIncomingMessage,
  buildContentResponse,
  buildNoBodyResponse,
  buildSSLCheckResponse,
  buildUrlVerificationResponse,
  extractRetryNumFromHTTPRequest,
  extractRetryReasonFromHTTPRequest,
  parseAndVerifyHTTPRequest,
  parseHTTPRequestBody,
} from './http-based';
import { initializeLogger } from './logger-initializer';

export default class KoaRecevier implements Receiver {
  private app: App | undefined;

  private logger: Logger;

  private signingSecretProvider: string | (() => PromiseLike<string>);

  private signatureVerification: boolean;

  private processBeforeResponse: boolean;

  private path: string;

  private unhandledRequestTimeoutMillis: number;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private customPropertiesExtractor: (request: BufferedIncomingMessage) => Record<string, any>;

  // ----------------------------

  private koa: Koa;

  private router: Router;

  private server: Server | undefined;

  private installer: InstallProvider | undefined;

  private installerOptions: InstallerOptions | undefined;

  public constructor(options: KoaReceiverOptions) {
    this.signatureVerification = options.signatureVerification ?? true;
    this.signingSecretProvider = options.signingSecret;
    this.customPropertiesExtractor = options.customPropertiesExtractor !== undefined ?
      options.customPropertiesExtractor : (_) => ({});
    this.path = options.path ?? '/slack/events';
    this.unhandledRequestTimeoutMillis = options.unhandledRequestTimeoutMillis ?? 3001;

    this.koa = options.koa;
    this.router = options.router;
    this.logger = initializeLogger(options.logger, options.logLevel);
    this.processBeforeResponse = options.processBeforeResponse ?? false;
    this.installerOptions = options.installerOptions;
    if (this.installerOptions && this.installerOptions.installPath === undefined) {
      this.installerOptions.installPath = '/slack/install';
    }
    if (this.installerOptions && this.installerOptions.redirectUriPath === undefined) {
      this.installerOptions.redirectUriPath = '/slack/oauth_redirect';
    }
    if (options.clientId && options.clientSecret) {
      this.installer = new InstallProvider({
        clientId: options.clientId,
        clientSecret: options.clientSecret,
        stateSecret: options.stateSecret,
        installationStore: options.installationStore,
        logger: options.logger,
        logLevel: options.logLevel,
        stateStore: this.installerOptions?.stateStore,
        stateVerification: this.installerOptions?.stateVerification,
        authVersion: this.installerOptions?.authVersion,
        clientOptions: this.installerOptions?.clientOptions,
        authorizationUrl: this.installerOptions?.authorizationUrl,
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
      this._sigingSecret = typeof this.signingSecretProvider === 'string' ? this.signingSecretProvider : await this.signingSecretProvider();
    }
    return this._sigingSecret;
  }

  public init(app: App): void {
    this.app = app;
    if (this.installer && this.installerOptions &&
      this.installerOptions.installPath &&
      this.installerOptions.redirectUriPath) {
      this.router.get(this.installerOptions.installPath, async (ctx) => {
        await this.installer?.handleInstallPath(
          ctx.req,
          ctx.res,
          this.installerOptions?.installPathOptions,
        );
      });
      this.router.get(this.installerOptions.redirectUriPath, async (ctx) => {
        await this.installer?.handleCallback(
          ctx.req,
          ctx.res,
          this.installerOptions?.callbackOptions,
        );
      });
    }

    this.router.post(this.path, async (ctx) => {
      const { req, res } = ctx;
      // Verify authenticity
      let bufferedReq: BufferedIncomingMessage;
      try {
        bufferedReq = await parseAndVerifyHTTPRequest(
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
        this.logger.warn(`Request verification failed: ${e.message}`);
        buildNoBodyResponse(res, 401);
        return;
      }

      // Parse request body
      // The object containing the parsed body is not exposed to the caller. It is preferred to reduce mutations to the
      // req object, so that its as reusable as possible. Later, we should consider adding an option for assigning the
      // parsed body to `req.body`, as this convention has been established by the popular `body-parser` package.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let body: any;
      try {
        body = parseHTTPRequestBody(bufferedReq);
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = err as any;
        this.logger.warn(`Malformed request body: ${e.message}`);
        buildNoBodyResponse(res, 400);
        return;
      }

      // Handle SSL checks
      if (body.ssl_check) {
        buildSSLCheckResponse(res);
        return;
      }

      // Handle URL verification
      if (body.type === 'url_verification') {
        buildUrlVerificationResponse(res, body);
        return;
      }

      let isAcknowledged = false;
      setTimeout(() => {
        if (!isAcknowledged) {
          this.logger.error(
            'An incoming event was not acknowledged within 3 seconds. Ensure that the ack() argument is called in a listener.',
          );
        }
      }, this.unhandledRequestTimeoutMillis);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let storedResponseBody: any;
      const event: ReceiverEvent = {
        body,
        ack: async (responseBody) => {
          this.logger.debug(`ack() call begins (body: ${responseBody})`);
          if (isAcknowledged) {
            throw new ReceiverMultipleAckError();
          }
          isAcknowledged = true;
          if (this.processBeforeResponse) {
            // In the case where processBeforeResponse: true is enabled, we don't send the HTTP response immediately.
            // We hold off until the listener execution is completed.
            if (!responseBody) {
              storedResponseBody = '';
            } else {
              storedResponseBody = responseBody;
            }
            this.logger.debug(`ack() response stored (body: ${responseBody})`);
          } else {
            buildContentResponse(res, responseBody);
            this.logger.debug(`ack() response sent (body: ${responseBody})`);
          }
        },
        retryNum: extractRetryNumFromHTTPRequest(req),
        retryReason: extractRetryReasonFromHTTPRequest(req),
        customProperties: this.customPropertiesExtractor(bufferedReq),
      };
      try {
        await this.app?.processEvent(event);
        if (storedResponseBody !== undefined) {
          buildContentResponse(res, storedResponseBody);
          this.logger.debug(`ack() response sent (body: ${storedResponseBody})`);
        }
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const e = err as any;
        if ('code' in e) {
          // CodedError has code: string
          const errorCode = (err as CodedError).code;
          if (errorCode === ErrorCode.AuthorizationError) {
            // authorize function threw an exception, which means there is no valid installation data
            buildNoBodyResponse(res, 401);
            isAcknowledged = true;
            return;
          }
        }
        buildNoBodyResponse(res, 500);
        throw err;
      }
    });
  }

  public start(port: number = 3000): Promise<Server> {
    // Enable routes
    this.koa
      .use(this.router.routes())
      .use(this.router.allowedMethods());

    return new Promise((resolve, reject) => {
      try {
        this.server = this.koa.listen(port);
        resolve(this.server);
      } catch (e) {
        reject(e);
      }
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
