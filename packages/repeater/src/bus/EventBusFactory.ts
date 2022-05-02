import { EventBus } from '@secbox/core';

export interface EventBusFactory {
  create(repeaterId: string): Promise<EventBus>;
}

export const EventBusFactory = Symbol('EventBusFactory');
