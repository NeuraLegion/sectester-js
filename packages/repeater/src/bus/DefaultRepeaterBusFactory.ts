import { RepeaterBus } from './RepeaterBus';
import { DefaultRepeaterBus } from './DefaultRepeaterBus';
import { RepeaterBusFactory } from './RepeaterBusFactory';
import { RepeaterCommandHub } from './RepeaterCommandHub';
import { RepeaterServer } from './RepeaterServer';
import { Configuration, Logger } from '@sectester/core';
import { inject, injectable } from 'tsyringe';

@injectable()
export class DefaultRepeaterBusFactory implements RepeaterBusFactory {
  constructor(
    private readonly logger: Logger,
    private readonly configuration: Configuration,
    @inject(RepeaterServer) private readonly repeaterServer: RepeaterServer,
    @inject(RepeaterCommandHub)
    private readonly commandHub: RepeaterCommandHub
  ) {}

  public create(repeaterId: string): RepeaterBus {
    this.logger.log(
      'Creating the repeater (%s, %s)...',
      repeaterId,
      this.configuration.version
    );

    return new DefaultRepeaterBus(
      repeaterId,
      this.logger,
      this.repeaterServer,
      this.commandHub
    );
  }
}
