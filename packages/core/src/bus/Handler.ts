export interface EventHandler<T, R = void> {
  handle(payload: T): Promise<R | undefined>;
}
