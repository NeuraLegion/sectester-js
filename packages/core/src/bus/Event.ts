import { EventDispatcher } from './EventDispatcher';
import { getTypeName } from '../utils';
import { v4 } from 'uuid';

export abstract class Event<T> {
  public readonly type: string;
  public readonly payload: T;
  public readonly correlationId: string;
  public readonly createdAt: Date;

  protected constructor(
    payload: T,
    type?: string,
    correlationId?: string,
    createdAt?: Date
  ) {
    this.payload = payload;
    this.type = type || getTypeName(payload);
    this.correlationId = correlationId || uuidv4();
    this.createdAt = createdAt || new Date();
  }

  public publish(dispatcher: EventDispatcher): Promise<void> {
    return dispatcher.publish<T>(this);
  }
}

export type EventConstructor<T = unknown, R extends Event<T> = Event<T>> = new (
  ...args: any[]
) => R;
