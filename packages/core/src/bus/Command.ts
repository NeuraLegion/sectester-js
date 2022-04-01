import { CommandDispatcher } from './CommandDispatcher';
import { randomBytes } from 'crypto';

export abstract class Command<T, R> {
  public readonly expectReply: boolean = true;
  public readonly ttl: number = 10000;
  public readonly type!: string;
  public readonly payload!: T;
  public readonly correlationId!: string;
  public readonly createdAt!: Date;

  constructor(
    payload: T,
    expectReply?: boolean,
    ttl?: number,
    type?: string,
    correlationId?: string,
    createdAt?: Date
  ) {
    this.payload = payload;

    if (expectReply) {
      this.expectReply = expectReply;
    }

    if (ttl) {
      this.ttl = ttl;
    }

    this.type = type || this.getType(payload);
    this.correlationId =
      correlationId || randomBytes(32).toString('hex').slice(0, 32);
    this.createdAt = createdAt || new Date();
  }

  public execute(dispatcher: CommandDispatcher): Promise<R> {
    return dispatcher.execute<T, R>(this);
  }

  private getType(payload: T) {
    const { constructor } = Object.getPrototypeOf(payload);

    return constructor.name as string;
  }
}
