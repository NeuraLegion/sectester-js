export interface AxiosCommandDispatcherConfig {
  baseUrl: string;
  token: string;
  timeout?: number;
  rate?: {
    window: number;
    limit: number;
  };
}

export const AxiosCommandDispatcherConfig: unique symbol = Symbol(
  'AxiosCommandDispatcherConfig'
);
