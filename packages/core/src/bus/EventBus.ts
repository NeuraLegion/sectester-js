import { CommandDispatcher } from './CommandDispatcher';
import { EventDispatcher } from './EventDispatcher';
import { EventHandlerConstructor } from './EventHandler';

export interface EventBus extends EventDispatcher, CommandDispatcher {
  register<T, R>(type: EventHandlerConstructor<T, R>): Promise<void>;

  unregister<T, R>(type: EventHandlerConstructor<T, R>): Promise<void>;

  init?(): Promise<void>;
  destroy?(): Promise<void>;
}

export const EventBus: unique symbol = Symbol('EventBus');
