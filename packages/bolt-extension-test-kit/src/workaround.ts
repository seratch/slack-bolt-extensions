import { InstallURLOptions } from '@slack/oauth';

// Remove this when @slack/oauth v2.5 is released
export interface CodedError extends Error {
  code: string; // This can be a value from ErrorCode, or WebClient's ErrorCode, or a NodeJS error code
}

// Remove this when @slack/oauth v2.5 is released
export class InvalidStateError extends Error implements CodedError {
  public code = 'slack_oauth_invalid_state';
}

// Remove this when @slack/oauth v2.5 is released
export interface StateObj {
  now: Date;
  installOptions: InstallURLOptions;
  random: number;
}
