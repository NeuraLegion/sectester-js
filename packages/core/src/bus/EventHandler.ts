export interface EventHandler<T, R = void> {
  handle(payload: T): Promise<R | undefined>;
}

export type EventHandlerConstructor<T = unknown, R = unknown> = new (
  ...args: any
) => EventHandler<T, R>;
