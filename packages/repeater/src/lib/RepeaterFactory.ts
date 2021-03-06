import { Repeater } from './Repeater';
import { RequestRunnerOptions } from '../request-runner';
import { RepeaterOptions } from './RepeaterOptions';
import { RepeatersManager } from '../api';
import { EventBusFactory } from '../bus';
import { Configuration } from '@sectester/core';
import { v4 as uuidv4 } from 'uuid';
import { DependencyContainer, injectable } from 'tsyringe';

/**
 *  A factory that is able to create a dedicated instance of the repeater with a bus and other dependencies.
 */
@injectable()
export class RepeaterFactory {
  private readonly DEFAULT_RUNNER_OPTIONS: Readonly<RequestRunnerOptions> = {
    timeout: 30000,
    maxContentLength: 100,
    reuseConnection: false,
    allowedMimes: [
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
  private readonly container: DependencyContainer;
  private readonly repeatersManager: RepeatersManager;
  private readonly eventBusFactory: EventBusFactory;

  constructor(private readonly configuration: Configuration) {
    this.container = this.configuration.container.createChildContainer();

    this.repeatersManager =
      this.container.resolve<RepeatersManager>(RepeatersManager);
    this.eventBusFactory =
      this.container.resolve<EventBusFactory>(EventBusFactory);
  }

  public async createRepeater(
    { namePrefix, description, requestRunnerOptions }: RepeaterOptions = {
      namePrefix: `sectester`
    }
  ): Promise<Repeater> {
    if (namePrefix && namePrefix.length > 44) {
      throw new Error('Name prefix must be less than 44 characters.');
    }

    this.registerRequestRunnerOptions(requestRunnerOptions);

    const { repeaterId } = await this.repeatersManager.createRepeater({
      name: `${namePrefix}-${uuidv4()}`,
      description
    });

    const bus = await this.eventBusFactory.create(repeaterId);

    await bus.init?.();

    return new Repeater({
      repeaterId,
      bus,
      configuration: this.configuration
    });
  }

  private registerRequestRunnerOptions(
    options: RequestRunnerOptions | undefined
  ): void {
    this.container.register(RequestRunnerOptions, {
      useValue: {
        ...this.DEFAULT_RUNNER_OPTIONS,
        ...(options ?? {})
      }
    });
  }
}
