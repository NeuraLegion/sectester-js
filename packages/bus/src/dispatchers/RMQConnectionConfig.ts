export interface RMQConnectionConfig {
  url: string;
  connectTimeout?: number;
  heartbeatInterval?: number;
  reconnectTime?: number;
  frameMax?: number;
  credentials?: {
    username: string;
    password: string;
  };
}

export const RMQConnectionConfig: unique symbol = Symbol('RMQConnectionConfig');
