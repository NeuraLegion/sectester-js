import { Repeater } from './Repeater';
import { RepeaterOptions } from './RepeaterOptions';
import { RepeatersManager } from '../api';
import { EventBusFactory } from '../bus';
import { Configuration } from '@secbox/core';
import { v4 as uuidv4 } from 'uuid';

/**
 *  A factory that is able to create a dedicated instance of the repeater with a bus and other dependencies.
 */
export class RepeaterFactory {
  private readonly eventBusFactory: EventBusFactory;
  private readonly repeatersManager: RepeatersManager;

  constructor(private readonly configuration: Configuration) {
    this.repeatersManager =
      this.configuration.container.resolve(RepeatersManager);
    this.eventBusFactory =
      this.configuration.container.resolve(EventBusFactory);
  }

  public async createRepeater(
    { namePrefix, description }: RepeaterOptions = {
      namePrefix: `secbox-sdk`
    }
  ): Promise<Repeater> {
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
}
