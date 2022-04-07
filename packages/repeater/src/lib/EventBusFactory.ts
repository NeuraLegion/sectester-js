import { inject, injectable } from 'tsyringe';
import { Configuration, EventBus, RetryStrategy } from '@secbox/core';
import { RMQEventBus, RMQEventBusConfig } from '@secbox/bus';

@injectable()
export class EventBusFactory {
  constructor(@inject(Configuration) private readonly config: Configuration) {}

  public async create(
    repeaterId: string,
    options: Omit<
      RMQEventBusConfig,
      'url' | 'appQueue' | 'clientQueue' | 'exchange' | 'credentials'
    > = {}
  ): Promise<EventBus> {
    await this.config?.loadCredentials();

    if (!this.config?.credentials) {
      throw new Error(
        'Please provide credentials to establish a connection with the bus.'
      );
    }

    const busConfig: RMQEventBusConfig = {
      ...options,
      url: this.config.bus,
      exchange: 'EventBus',
      appQueue: 'app',
      clientQueue: `agent:${repeaterId}`,
      credentials: {
        username: 'bot',
        password: this.config.credentials.token ?? ''
      }
    };

    return new (RMQEventBus as any)(
      this.config.container,
      this.config.container.resolve(RetryStrategy),
      busConfig
    );
  }
}
