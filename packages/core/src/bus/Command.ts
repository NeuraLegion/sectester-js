import { CommandDispatcher } from './CommandDispatcher';
import { Message } from './Message';

export abstract class Command<T, R> extends Message<T> {
  public readonly expectReply: boolean = true;
  public readonly ttl: number = 10000;

  protected constructor(
    payload: T,
    expectReply?: boolean,
    ttl?: number,
    type?: string,
    correlationId?: string,
    createdAt?: Date
  ) {
    super(payload, type, correlationId, createdAt);

    if (typeof expectReply === 'boolean') {
      this.expectReply = expectReply;
    }

    if (typeof ttl === 'number' && ttl > 0) {
      this.ttl = ttl;
    }
  }

  public execute(dispatcher: CommandDispatcher): Promise<R | undefined> {
    return dispatcher.execute<T, R>(this);
  }
}
