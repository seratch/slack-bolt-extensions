This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app). The app serves the following API endpoints for Slack integration.

```
GET  /api/slack/install
GET  /api/slack/oauth_redirect
POST /api/slack/events
```

Before starting this app by `npm run dev`, you need to set the following env variables:

```bash
export SLACK_SIGNING_SECRET=
export SLACK_CLIENT_ID=
export SLACK_CLIENT_SECRET=
```
