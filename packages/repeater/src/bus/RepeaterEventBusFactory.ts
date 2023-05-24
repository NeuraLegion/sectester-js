import 'reflect-metadata';
import { EventBusFactory } from './EventBusFactory';
import { autoInjectable, DependencyContainer, inject } from 'tsyringe';
import {
  Configuration,
  EventBus,
  Logger,
  RetryStrategy
} from '@sectester/core';
import {
  RMQEventBus,
  RMQEventBusConfig,
  RMQConnectionManager
} from '@sectester/bus';

@autoInjectable()
export class RepeaterEventBusFactory implements EventBusFactory {
  constructor(
    private readonly container: DependencyContainer,
    private readonly config: Configuration,
    @inject(RetryStrategy) private readonly retryStrategy: RetryStrategy
  ) {}

  public async create(repeaterId: string): Promise<EventBus> {
    await this.config.loadCredentials();

    if (!this.config.credentials) {
      throw new Error(
        'Please provide credentials to establish a connection with the bus.'
      );
    }

    // ADHOC: special handling of async providers
    // For details please see: https://github.com/microsoft/tsyringe/issues/66
    const connection = await this.container.resolve<
      Promise<RMQConnectionManager>
    >(RMQConnectionManager);

    const busConfig: RMQEventBusConfig = {
      exchange: 'EventBus',
      appQueue: 'app',
      clientQueue: `agent:${repeaterId}`
    };

    return new RMQEventBus(
      this.container,
      this.container.resolve(Logger),
      this.retryStrategy,
      busConfig,
      connection
    );
  }
}
