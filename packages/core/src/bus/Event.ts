import { EventDispatcher } from './EventDispatcher';
import { randomBytes } from 'crypto';

export abstract class Event<T> {
  public readonly type!: string;
  public readonly payload!: T;
  public readonly correlationId!: string;
  public readonly createdAt!: Date;

  constructor(
    payload: T,
    type?: string,
    correlationId?: string,
    createdAt?: Date
  ) {
    this.payload = payload;
    this.type = type || this.getType(payload);
    this.correlationId =
      correlationId || randomBytes(32).toString('hex').slice(0, 32);
    this.createdAt = createdAt || new Date();
  }

  public publish(dispatcher: EventDispatcher): Promise<void> {
    return dispatcher.publish<T>(this);
  }

  private getType(payload: T) {
    const { constructor } = Object.getPrototypeOf(payload);

    return constructor.name as string;
  }
}

export type EventType<T, R extends Event<T> = Event<T>> = new (
  ...args: any[]
) => R;
