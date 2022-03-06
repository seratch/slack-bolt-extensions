/* eslint-disable import/prefer-default-export */
import { parse as qsParse } from 'querystring';
import { BufferedIncomingMessage } from '.';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseHTTPRequestBody(req: BufferedIncomingMessage): any {
  const bodyAsString = req.rawBody.toString();
  const contentType = req.headers['content-type'];
  if (contentType === 'application/x-www-form-urlencoded') {
    const parsedQs = qsParse(bodyAsString);
    const { payload } = parsedQs;
    if (typeof payload === 'string') {
      return JSON.parse(payload);
    }
    return parsedQs;
  }
  return JSON.parse(bodyAsString);
}
