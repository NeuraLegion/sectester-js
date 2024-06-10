export interface RepeaterBus {
  readonly repeaterId?: string;
  connect(): Promise<void>;
  close(): Promise<void>;
}

export const RepeaterBus: unique symbol = Symbol('RepeaterBus');
