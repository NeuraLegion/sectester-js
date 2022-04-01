import { EventDispatcher } from './EventDispatcher';
import { v4 as uuidv4 } from 'uuid';

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
    this.correlationId = correlationId || uuidv4();
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

export type EventType<T = unknown, R extends Event<T> = Event<T>> = new (
  ...args: any[]
) => R;
