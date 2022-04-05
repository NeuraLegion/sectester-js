import { EventDispatcher } from './EventDispatcher';
import { Message } from './Message';

export abstract class Event<T> extends Message<T> {
  protected constructor(
    payload: T,
    type?: string,
    correlationId?: string,
    createdAt?: Date
  ) {
    super(payload, type, correlationId, createdAt);
  }

  public publish(dispatcher: EventDispatcher): Promise<void> {
    return dispatcher.publish<T>(this);
  }
}
