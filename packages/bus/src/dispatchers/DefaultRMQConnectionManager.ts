import { RMQConnectionManager } from './RMQConnectionManager';
import { RMQConnectionConfig } from './RMQConnectionConfig';
import {
  type AmqpConnectionManager,
  type AmqpConnectionManagerOptions,
  type ChannelWrapper
} from 'amqp-connection-manager';
import { inject, injectable } from 'tsyringe';
import { Logger } from '@sectester/core';

@injectable()
export class DefaultRMQConnectionManager implements RMQConnectionManager {
  private readonly DEFAULT_RECONNECT_TIME = 20;
  private readonly DEFAULT_HEARTBEAT_INTERVAL = 30;

  private client?: AmqpConnectionManager;

  constructor(
    private readonly logger: Logger,
    @inject(RMQConnectionConfig) private readonly config: RMQConnectionConfig
  ) {}

  get connected(): boolean {
    return !!this.client?.isConnected();
  }

  public async connect(): Promise<void> {
    if (!this.client) {
      const url = this.buildUrl();
      const options = this.buildOptions();

      this.client = new (
        await import('amqp-connection-manager')
      ).AmqpConnectionManagerClass(url, options);

      await this.client.connect({
        timeout:
          (this.config.connectTimeout ?? this.DEFAULT_RECONNECT_TIME) * 1000
      });

      this.logger.debug('Connected to %s', this.config.url);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
      }

      delete this.client;

      this.logger.debug('Disconnected from %s', this.config.url);
    } catch (e) {
      this.logger.error('Cannot terminate a connection to bus gracefully');
      this.logger.debug('Connection to the event bus terminated');
      this.logger.debug('Error on disconnect: %s', e.message);
    }
  }

  public createChannel(): ChannelWrapper {
    this.throwIfNotConnected();

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.client!.createChannel({
      json: false
    });
  }

  private throwIfNotConnected(): void {
    if (!this.connected) {
      throw new Error(
        'Please make sure that client established a connection with host.'
      );
    }
  }

  private buildUrl(): string {
    const url = new URL(this.config.url);

    const { frameMax } = this.config;

    if (frameMax !== null && frameMax !== undefined) {
      url.searchParams.append('frameMax', frameMax.toString(10));
    }

    return url.toString();
  }

  private buildOptions(): AmqpConnectionManagerOptions {
    const { reconnectTime, heartbeatInterval, credentials } = this.config;

    return {
      heartbeatIntervalInSeconds:
        heartbeatInterval ?? this.DEFAULT_HEARTBEAT_INTERVAL,
      reconnectTimeInSeconds: reconnectTime ?? this.DEFAULT_RECONNECT_TIME,
      connectionOptions: {
        ...(credentials
          ? { credentials: this.createAuthRequest(credentials) }
          : {})
      }
    };
  }

  private createAuthRequest(plain: { username: string; password: string }): {
    password: string;
    response(): Buffer;
    mechanism: 'PLAIN';
    username: string;
  } {
    return {
      ...plain,
      mechanism: 'PLAIN',
      /* istanbul ignore next */
      response(): Buffer {
        return Buffer.from(
          ['', plain.username, plain.password].join(String.fromCharCode(0))
        );
      }
    };
  }
}
