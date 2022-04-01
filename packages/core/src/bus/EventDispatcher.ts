import { Event } from './Event';

export interface EventDispatcher {
  publish<T>(event: Event<T>): Promise<void>;
}

export const EventDispatcher: unique symbol = Symbol('EventDispatcher');

