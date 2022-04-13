export interface RMQEventBusConfig {
  url: string;
  exchange: string;
  clientQueue: string;
  appQueue: string;
  prefetchCount?: number;
  connectTimeout?: number;
  heartbeatInterval?: number;
  reconnectTime?: number;
  frameMax?: number;
  credentials?: {
    username: string;
    password: string;
  };
}

export const RMQEventBusConfig: unique symbol = Symbol('RMQEventBusConfig');
