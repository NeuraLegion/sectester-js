export interface EventHandler<T, R = void> {
  handle(payload: T): Promise<R | undefined>;
}

export type EventHandlerConstructor<T, R> = new (
  ...args: unknown[]
) => EventHandler<T, R>;
