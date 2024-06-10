import { RepeaterBus } from './RepeaterBus';

export interface RepeaterBusFactory {
  create(): RepeaterBus;
}

export const RepeaterBusFactory: unique symbol = Symbol('RepeaterBusFactory');
