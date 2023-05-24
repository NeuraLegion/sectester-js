import { ChannelWrapper } from 'amqp-connection-manager';

export interface RMQConnectionManager {
  connected: boolean;

  connect(): Promise<void>;

  disconnect(): Promise<void>;

  createChannel(): ChannelWrapper;
}

export const RMQConnectionManager: unique symbol = Symbol(
  'RMQConnectionManager'
);
