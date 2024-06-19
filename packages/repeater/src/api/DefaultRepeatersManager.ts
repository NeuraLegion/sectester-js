import { RepeatersManager } from './RepeatersManager';
import {
  CreateRepeaterRequest,
  DeleteRepeaterRequest,
  GetRepeaterRequest
} from './commands';
import { inject, injectable } from 'tsyringe';
import { CommandDispatcher } from '@sectester/core';

@injectable()
export class DefaultRepeatersManager implements RepeatersManager {
  constructor(
    @inject(CommandDispatcher)
    private readonly commandDispatcher: CommandDispatcher
  ) {}

  public async getRepeater(
    repeaterId: string
  ): Promise<{ repeaterId: string }> {
    const repeater = await this.commandDispatcher.execute(
      new GetRepeaterRequest(repeaterId)
    );

    if (!repeater?.id) {
      throw new Error('Cannot find repeater');
    }

    return { repeaterId: repeater.id };
  }

  public async createRepeater({
    projectId,
    ...options
  }: {
    name: string;
    description?: string;
    projectId?: string;
  }): Promise<{ repeaterId: string }> {
    const repeater = await this.commandDispatcher.execute(
      new CreateRepeaterRequest({
        ...options,
        ...(projectId ? { projectIds: [projectId] } : {})
      })
    );
    if (!repeater?.id) {
      throw new Error('Cannot create a new repeater.');
    }

    return { repeaterId: repeater.id };
  }

  public async deleteRepeater(repeaterId: string): Promise<void> {
    return this.commandDispatcher.execute(
      new DeleteRepeaterRequest({ repeaterId })
    );
  }
}
