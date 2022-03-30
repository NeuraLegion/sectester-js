export interface Handler<T, R> {
  handle(argument: T): Promise<R>;
}
