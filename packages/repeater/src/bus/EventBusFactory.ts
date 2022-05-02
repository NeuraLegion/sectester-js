import { EventBus } from '@sec-tester/core';

export interface EventBusFactory {
  create(repeaterId: string): Promise<EventBus>;
}

export const EventBusFactory: unique symbol = Symbol('EventBusFactory');
