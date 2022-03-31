/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppRunner } from 'slack-bolt-http-runner';
import { App, FileInstallationStore, LogLevel } from '@slack/bolt';
import { FileStateStore } from '@slack/oauth';

@Injectable()
export class SlackBoltMiddleware implements NestMiddleware {
  private appRunner: AppRunner;

  public constructor() {
    const runner = new AppRunner({
      logLevel: LogLevel.DEBUG,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      signingSecret: process.env.SLACK_SIGNING_SECRET!,
      clientId: process.env.SLACK_CLIENT_ID,
      clientSecret: process.env.SLACK_CLIENT_SECRET,
      scopes: ['commands', 'chat:write', 'app_mentions:read'],
      installationStore: new FileInstallationStore(),
      installerOptions: {
        directInstall: true,
        stateStore: new FileStateStore({}),
      },
    });

    const app = new App(runner.appOptions());

    app.event('app_mention', async ({ say }) => {
      await say('Hi there!');
    });

    runner.setup(app);
    this.appRunner = runner;
  }

  async use(req: Request, res: Response, next: NextFunction) {
    if (req.path === '/slack/events') {
      await this.appRunner.handleEvents(req, res);
    } else if (req.path === '/slack/install') {
      await this.appRunner.handleInstallPath(req, res);
    } else if (req.path === '/slack/oauth_redirect') {
      await this.appRunner.handleCallback(req, res);
    } else {
      next();
    }
  }
}
