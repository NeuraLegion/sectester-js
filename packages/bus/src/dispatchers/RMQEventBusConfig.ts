export interface RMQEventBusConfig {
  exchange: string;
  clientQueue: string;
  appQueue: string;
  prefetchCount?: number;
}

export const RMQEventBusConfig: unique symbol = Symbol('RMQEventBusConfig');
