export interface RepeaterBus {
  connect(): Promise<void>;
  close(): Promise<void>;
}

export const RepeaterBus: unique symbol = Symbol('RepeaterBus');
