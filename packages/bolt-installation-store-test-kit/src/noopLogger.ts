/* eslint-disable import/prefer-default-export */
import { Logger, LogLevel } from '@slack/logger';

export const noopLogger: Logger = {
  debug(..._msg) { /* noop */ },
  info(..._msg) { /* noop */ },
  warn(..._msg) { /* noop */ },
  error(..._msg) { /* noop */ },
  setLevel(_level) { /* noop */ },
  getLevel() { return LogLevel.DEBUG; },
  setName(_name) { /* noop */ },
};
