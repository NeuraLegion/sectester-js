import { CommandDispatcher } from './CommandDispatcher';
import { Event } from './Event';
import { EventDispatcher } from './EventDispatcher';
import { EventHandler } from './EventHandler';

export interface EventBus extends EventDispatcher, CommandDispatcher {
  register<T extends Event<R>, R>(
    type: new (...args: unknown[]) => EventHandler<T>
  ): Promise<void>;

  unregister<T extends Event<R>, R>(
    type: new (...args: unknown[]) => EventHandler<T>
  ): Promise<void>;

  init?(): Promise<void>;
  destroy?(): Promise<void>;
}

export const EventBus: unique symbol = Symbol('EventBus');
