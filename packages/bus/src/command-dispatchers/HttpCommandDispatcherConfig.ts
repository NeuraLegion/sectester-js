import { rateLimitOptions } from 'axios-rate-limit';

export interface HttpCommandDispatcherConfig {
  url: string;
  axiosLimitOptions?: rateLimitOptions;
  credentials?: {
    username: string;
    password: string;
  };
}

export const HttpCommandDispatcherConfig: unique symbol = Symbol(
  'HttpCommandDispatcherConfig'
);
