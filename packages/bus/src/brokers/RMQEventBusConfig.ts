export interface RMQEventBusConfig {
  url: string;
  exchange: string;
  clientQueue: string;
  prefetchCount?: number;
  socketOptions?: {
    connectTimeout?: number;
    heartbeatInterval?: number;
    reconnectTime?: number;
  };
  credentials?: {
    username: string;
    password: string;
  };
}

export const RMQEventBusConfig: unique symbol = Symbol('RMQEventBusConfig');
