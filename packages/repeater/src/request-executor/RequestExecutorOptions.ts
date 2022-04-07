export interface RequestExecutorOptions {
  timeout?: number;
  proxyUrl?: string;
  headers?: Record<string, string | string[]>;
  whitelistMimes?: string[];
  maxContentLength?: number;
  reuseConnection?: boolean;
}

export const RequestExecutorOptions: unique symbol = Symbol(
  'RequestExecutorOptions'
);
