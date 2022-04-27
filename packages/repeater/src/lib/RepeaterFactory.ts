import { Repeater } from './Repeater';
import { RequestRunnerOptions } from '../request-runner';
import { RepeaterOptions } from './RepeaterOptions';
import { RepeatersManager } from '../api';
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
    const container = this.registerRunnerOptions(requestRunnerOptions);
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
    options: RequestRunnerOptions | undefined
  ): DependencyContainer {
    const container = this.configuration.container.createChildContainer();

    if (options) {
      container.register(RequestRunnerOptions, { useValue: options });
    }

    container.register('container', { useValue: container });

    return container;
  }
}
