import { RepeatersManager } from './RepeatersManager';
import { CreateRepeaterRequest, DeleteRepeaterRequest } from './commands';
import { inject, injectable } from 'tsyringe';
import { CommandDispatcher } from '@sectester/core';

@injectable()
export class DefaultRepeatersManager implements RepeatersManager {
  constructor(
    @inject(CommandDispatcher)
    private readonly commandDispatcher: CommandDispatcher
  ) {}

  public async createRepeater(payload: {
    name: string;
    description?: string;
  }): Promise<{ repeaterId: string }> {
    const repeater = await this.commandDispatcher.execute(
      new CreateRepeaterRequest(payload)
    );

    if (!repeater?.id) {
      throw new Error('Cannot find created repeater id');
    }

    return { repeaterId: repeater.id };
  }

  public async deleteRepeater(repeaterId: string): Promise<void> {
    return this.commandDispatcher.execute(
      new DeleteRepeaterRequest({ repeaterId })
    );
  }
}
