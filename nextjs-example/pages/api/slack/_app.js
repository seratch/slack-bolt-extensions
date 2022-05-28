import { App, LogLevel, FileInstallationStore } from "@slack/bolt";
import { FileStateStore } from "@slack/oauth";
import { AppRunner } from "slack-bolt-http-runner";

export const appRunner = new AppRunner({
  logLevel: LogLevel.DEBUG,
  // token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  scopes: ["commands", "chat:write", "app_mentions:read"],
  installationStore: new FileInstallationStore(),
  installerOptions: {
    stateStore: new FileStateStore({}),
  },
});

const app = new App(appRunner.appOptions());

app.event("app_mention", async ({ say }) => {
  await say("Hi there!");
});

app.command("/hi-nextjs", async ({ ack }) => {
  await ack("Hi there!");
});

appRunner.setup(app);
