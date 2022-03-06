// The arguments for the dispatchErrorHandler,

import { Logger } from '@slack/logger';
import { IncomingMessage, ServerResponse } from 'http';
import { ErrorCode, CodedError } from '@slack/bolt';

// which handles errors occurred while dispatching a rqeuest
export interface ReceiverDispatchErrorHandlerArgs {
  error: Error | CodedError;
  logger: Logger;
  request: IncomingMessage;
  response: ServerResponse;
}

// The arguments for the processEventErrorHandler,
// which handles errors `await app.processEvent(even)` method throws
export interface ReceiverProcessEventErrorHandlerArgs {
  error: Error | CodedError;
  logger: Logger;
  request: IncomingMessage;
  response: ServerResponse;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  storedResponse: any;
}

// The arguments for the unhandledRequestHandler,
// which deals with any unhandled incoming requests from Slack.
// (The default behavior is just printing error logs)
export interface ReceiverUnhandledRequestHandlerArgs {
  logger: Logger;
  request: IncomingMessage;
  response: ServerResponse;
}

// The default dispathErrorHandler implementation:
// Developers can customize this behavior by passing dispatchErrorHandler to the constructor
// Note that it was not possible to make this function async due to the limitation of http module
export function defaultDispatchErrorHandler(args: ReceiverDispatchErrorHandlerArgs): void {
  const { error, logger, request, response } = args;
  if ('code' in error) {
    if (error.code === ErrorCode.HTTPReceiverDeferredRequestError) {
      logger.info(`Unhandled HTTP request (${request.method}) made to ${request.url}`);
      response.writeHead(404);
      response.end();
      return;
    }
  }
  logger.error(`An unexpected error occurred during a request (${request.method}) made to ${request.url}`);
  logger.debug(`Error details: ${error}`);
  response.writeHead(500);
  response.end();
}

// The default processEventErrorHandler implementation:
// Developers can customize this behavior by passing processEventErrorHandler to the constructor
export async function defaultProcessEventErrorHandler(
  args: ReceiverProcessEventErrorHandlerArgs,
): Promise<boolean> {
  const { error, response, logger, storedResponse } = args;
  if ('code' in error) {
    // CodedError has code: string
    const errorCode = (error as CodedError).code;
    if (errorCode === ErrorCode.AuthorizationError) {
      // authorize function threw an exception, which means there is no valid installation data
      response.writeHead(401);
      response.end();
      return true;
    }
  }
  logger.error('An unhandled error occurred while Bolt processed an event');
  logger.debug(`Error details: ${error}, storedResponse: ${storedResponse}`);
  response.writeHead(500);
  response.end();
  return false;
}

// The default unhandledRequestHandler implementation:
// Developers can customize this behavior by passing unhandledRequestHandler to the constructor
// Note that this method cannot be an async function to align with the implementation using setTimeout
export function defaultUnhandledRequestHandler(args: ReceiverUnhandledRequestHandlerArgs): void {
  const { logger } = args;
  logger.error(
    'An incoming event was not acknowledged within 3 seconds. ' +
      'Ensure that the ack() argument is called in a listener.',
  );
}
