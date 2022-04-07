import { Repeaters } from './Repeaters';
import { Repeater } from './Repeater';
import { RepeaterOptions } from './RepeaterOptions';
import { EventBusFactory } from './EventBusFactory';
import { Configuration } from '@secbox/core';

/**
 *  A factory that is able to create a dedicated instance of the repeater with a bus and other dependencies.
 */
export class RepeaterFactory {
  private readonly eventBusFactory: EventBusFactory;
  private readonly repeaters: Repeaters;

  constructor(private readonly configuration: Configuration) {
    this.repeaters = this.configuration.container.resolve(Repeaters);
    this.eventBusFactory =
      this.configuration.container.resolve(EventBusFactory);
  }

  public async createRepeater(
    {
      name,
      description,
      certificates,
      networkDiagnostic,
      remoteScripts
    }: RepeaterOptions = {
      name: `secbox-sdk repeater ${new Date().toISOString()}`
    }
  ): Promise<Repeater> {
    const { repeaterId } = await this.repeaters.createRepeater({
      name,
      description
    });
    const bus = await this.eventBusFactory.create(repeaterId);

    await bus.init?.();

    if (certificates) {
      // do something
    }

    if (networkDiagnostic) {
      // do something
    }

    if (remoteScripts) {
      // do something
    }

    return new Repeater({
      repeaterId,
      bus,
      configuration: this.configuration
    });
  }
}
