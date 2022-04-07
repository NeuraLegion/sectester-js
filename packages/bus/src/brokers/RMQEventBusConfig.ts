import type { AmqpConnectionManagerOptions } from 'amqp-connection-manager';

export interface RMQEventBusConfig {
  url: string;
  exchange: string;
  clientQueue: string;
  appQueue: string;
  prefetchCount?: number;
  socketOptions?: AmqpConnectionManagerOptions & {
    connectTimeout?: number;
  };
  credentials?: {
    username: string;
    password: string;
  };
}

export const RMQEventBusConfig: unique symbol = Symbol('RMQEventBusConfig');
