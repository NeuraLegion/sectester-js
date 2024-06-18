import { RepeaterBus } from './RepeaterBus';
import { DefaultRepeaterBus } from './DefaultRepeaterBus';
import { RepeaterBusFactory } from './RepeaterBusFactory';
import { RepeaterCommands } from './RepeaterCommands';
import { RepeaterServer } from './RepeaterServer';
import { RepeaterId } from '../lib/Repeater';
import { Configuration, Logger } from '@sectester/core';
import { inject, injectable } from 'tsyringe';

@injectable()
export class DefaultRepeaterBusFactory implements RepeaterBusFactory {
  constructor(
    @inject(RepeaterId)
    private readonly repeaterId: RepeaterId,
    private readonly logger: Logger,
    private readonly configuration: Configuration,
    @inject(RepeaterServer) private readonly repeaterServer: RepeaterServer,
    @inject(RepeaterCommands)
    private readonly repeaterCommands: RepeaterCommands
  ) {}

  public create(): RepeaterBus {
    this.logger.log(
      'Creating the repeater (%s)...',
      this.configuration.version
    );

    return new DefaultRepeaterBus(
      this.repeaterId,
      this.logger,
      this.repeaterServer,
      this.repeaterCommands
    );
  }
}
