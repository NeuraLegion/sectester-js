import { CommandDispatcher } from './CommandDispatcher';
import { EventDispatcher } from './EventDispatcher';
import { EventHandlerConstructor } from './EventHandler';

export interface EventBus extends EventDispatcher, CommandDispatcher {
  register(type: EventHandlerConstructor): Promise<void>;

  unregister(type: EventHandlerConstructor): Promise<void>;

  init?(): Promise<void>;

  destroy?(): Promise<void>;
}

export const EventBus: unique symbol = Symbol('EventBus');
