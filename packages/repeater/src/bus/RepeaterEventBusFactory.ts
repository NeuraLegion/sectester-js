import { EventBusFactory } from './EventBusFactory';
import { autoInjectable, DependencyContainer, inject } from 'tsyringe';
import { Configuration, EventBus, RetryStrategy } from '@sec-tester/core';
import { RMQEventBus, RMQEventBusConfig } from '@sec-tester/bus';

@autoInjectable()
export class RepeaterEventBusFactory implements EventBusFactory {
  constructor(
    private readonly container: DependencyContainer,
    private readonly config: Configuration,
    @inject(RetryStrategy) private readonly retryStrategy: RetryStrategy
  ) {}

  public async create(
    repeaterId: string,
    options: Omit<
      RMQEventBusConfig,
      'url' | 'appQueue' | 'clientQueue' | 'exchange' | 'credentials'
    > = {}
  ): Promise<EventBus> {
    await this.config.loadCredentials();

    if (!this.config.credentials) {
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

    return new RMQEventBus(this.container, this.retryStrategy, busConfig);
  }
}
