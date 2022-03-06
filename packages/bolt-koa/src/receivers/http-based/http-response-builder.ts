/* eslint-disable import/prefer-default-export */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { ServerResponse } from 'http';

export function buildNoBodyResponse(res: ServerResponse, status: number): void {
  res.writeHead(status);
}

export function buildUrlVerificationResponse(res: ServerResponse, body: any): void {
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ challenge: body.challenge }));
}

export function buildSSLCheckResponse(res: ServerResponse): void {
  res.writeHead(200);
  res.end();
}

export function buildContentResponse(res: ServerResponse, body: string | any | undefined): void {
  if (!body) {
    res.writeHead(200);
    res.end();
  } else if (typeof body === 'string') {
    res.writeHead(200);
    res.end(body);
  } else {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
  }
}
