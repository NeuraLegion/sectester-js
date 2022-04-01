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
    this.correlationId = correlationId || v4();
    this.createdAt = createdAt || new Date();
  }

  public publish(dispatcher: EventDispatcher): Promise<void> {
    return dispatcher.publish<T>(this);
  }
}
