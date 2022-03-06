/* eslint-disable import/prefer-default-export */
import { ConsoleLogger, Logger, LogLevel } from '@slack/logger';

export function initializeLogger(
  logger: Logger | undefined,
  logLevel: LogLevel | undefined,
): Logger {
  if (logger !== undefined) {
    return logger;
  }
  const newLogger = new ConsoleLogger();
  if (logLevel !== undefined) {
    newLogger.setLevel(logLevel);
  }
  return newLogger;
}
