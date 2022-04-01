/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import { EventDispatcher } from './EventDispatcher';
import { BusInstruction } from './BusInstruction';

export abstract class Event<T> extends BusInstruction<T> {
  public publish(dispatcher: EventDispatcher): Promise<void> {
    return dispatcher.publish<T>(this);
  }
}

export type EventType<T, R extends Event<T> = Event<T>> = new (
  ...args: any[]
) => R;
