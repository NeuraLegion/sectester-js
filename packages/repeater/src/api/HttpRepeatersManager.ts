import { RepeatersManager } from './RepeatersManager';
import {
  CreateRepeaterRequest,
  DeleteRepeaterRequest,
  ListRepeatersRequest
} from './commands';
import { inject, injectable } from 'tsyringe';
import { CommandDispatcher } from '@secbox/core';

@injectable()
export class HttpRepeatersManager implements RepeatersManager {
  constructor(
    @inject(CommandDispatcher)
    private readonly commandDispatcher: CommandDispatcher
  ) {}

  public async createRepeater(payload: {
    name: string;
    description?: string;
  }): Promise<{ repeaterId: string }> {
    await this.commandDispatcher.execute(new CreateRepeaterRequest(payload));

    const repeaterId = (
      await this.commandDispatcher.execute(new ListRepeatersRequest())
    )?.find(repeater => repeater.name === payload.name)?.id;

    if (!repeaterId) {
      throw new Error('Cannot find created repeater id');
    }

    return { repeaterId };
  }

  public async deleteRepeater(repeaterId: string): Promise<void> {
    return this.commandDispatcher.execute(
      new DeleteRepeaterRequest({ repeaterId })
    );
  }
}
