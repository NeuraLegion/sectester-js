import { RepeaterBus } from './RepeaterBus';

export interface RepeaterBusFactory {
  create(repeaterId: string): RepeaterBus;
}

export const RepeaterBusFactory: unique symbol = Symbol('RepeaterBusFactory');
