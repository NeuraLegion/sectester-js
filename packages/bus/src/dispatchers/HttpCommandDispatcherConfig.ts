export interface HttpCommandDispatcherConfig {
  baseUrl: string;
  token: string;
  timeout?: number;
  maxSockets?: number;
  keepAlive?: boolean;
  rate?: {
    window: number;
    limit: number;
  };
}

export const HttpCommandDispatcherConfig: unique symbol = Symbol(
  'HttpCommandDispatcherConfig'
);
