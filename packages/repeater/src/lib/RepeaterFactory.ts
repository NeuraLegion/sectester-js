import { Repeater } from './Repeater';
import { RequestRunnerOptions } from '../request-runner';
import { RepeaterOptions } from './RepeaterOptions';
import { RepeatersManager } from '../api';
import { Container } from '../models';
import { EventBusFactory } from '../bus';
import { Configuration } from '@secbox/core';
import { v4 as uuidv4 } from 'uuid';
import { DependencyContainer } from 'tsyringe';

/**
 *  A factory that is able to create a dedicated instance of the repeater with a bus and other dependencies.
 */
export class RepeaterFactory {
  constructor(private readonly configuration: Configuration) {}

  public async createRepeater(
    { namePrefix, description, requestRunnerOptions }: RepeaterOptions = {
      namePrefix: `secbox-sdk`
    }
  ): Promise<Repeater> {
    const container = this.performContainer();
    this.registerRunnerOptions(container, requestRunnerOptions);
    const repeatersManager =
      container.resolve<RepeatersManager>(RepeatersManager);
    const eventBusFactory = container.resolve<EventBusFactory>(EventBusFactory);

    const { repeaterId } = await repeatersManager.createRepeater({
      name: `${namePrefix}-${uuidv4()}`,
      description
    });
    const bus = await eventBusFactory.create(repeaterId);

    await bus.init?.();

    return new Repeater({
      repeaterId,
      bus,
      configuration: this.configuration
    });
  }

  private registerRunnerOptions(
    container: DependencyContainer,
    options: RequestRunnerOptions | undefined
  ): void {
    let optionsToRegister: RequestRunnerOptions = {
      timeout: 30000,
      maxContentLength: 100,
      reuseConnection: false,
      whitelistMimes: [
        'text/html',
        'text/plain',
        'text/css',
        'text/javascript',
        'text/markdown',
        'text/xml',
        'application/javascript',
        'application/x-javascript',
        'application/json',
        'application/xml',
        'application/x-www-form-urlencoded',
        'application/msgpack',
        'application/ld+json',
        'application/graphql'
      ]
    };

    if (options) {
      optionsToRegister = { ...optionsToRegister, ...options };
    }

    container.register(RequestRunnerOptions, {
      useValue: { ...optionsToRegister }
    });
  }

  private performContainer(): DependencyContainer {
    const container = this.configuration.container.createChildContainer();
    container.register(Container, { useValue: container });

    return container;
  }
}
