import { CommandDispatcher } from './CommandDispatcher';
import { BusInstruction } from './BusInstruction';

export abstract class Command<T, R> extends BusInstruction<T> {
  public readonly expectReply: boolean = true;
  public readonly ttl: number = 10000;

  public execute(dispatcher: CommandDispatcher): Promise<R> {
    return dispatcher.execute<T, R>(this);
  }
}
