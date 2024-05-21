import 'reflect-metadata';
import {
  RepeaterServerEventHandler,
  RepeaterServerEvents,
  RepeaterServerEventsMap
} from './RepeaterServer';
import { injectable, Lifecycle, scoped } from 'tsyringe';
import { EventEmitter } from 'events';

export type CallbackFunction<T = unknown> = (arg: T) => unknown;
export type HandlerFunction = (args: unknown[]) => unknown;
export type ErrorHandlerFunction = (
  error: Error,
  event: string,
  args: unknown[]
) => unknown;

@scoped(Lifecycle.ContainerScoped)
@injectable()
export class RepeaterApplicationEvents {
  public onError: ErrorHandlerFunction | undefined;

  protected readonly events = new EventEmitter();

  private readonly handlerMap = new WeakMap<
    RepeaterServerEventHandler<any>,
    HandlerFunction
  >();

  public emit(event: RepeaterServerEvents, ...rest: unknown[]) {
    this.events.emit(event, ...rest);
  }

  public removeAllListeners() {
    this.events.removeAllListeners();
  }

  public off<K extends keyof RepeaterServerEventsMap>(
    event: K,
    handler: RepeaterServerEventHandler<K>
  ): void {
    const wrappedHandler = this.handlerMap.get(handler);
    if (wrappedHandler) {
      this.events.off(event, wrappedHandler);
      this.handlerMap.delete(handler);
    }
  }

  public on<K extends keyof RepeaterServerEventsMap>(
    event: K,
    handler: RepeaterServerEventHandler<K>
  ): void {
    const wrappedHandler = (...args: unknown[]) =>
      this.wrapEventListener(event, handler, ...args);
    this.handlerMap.set(handler, wrappedHandler);
    this.events.on(event, wrappedHandler);
  }

  private async wrapEventListener<TArgs extends TArg[], TArg>(
    event: string,
    handler: (...payload: TArgs) => unknown,
    ...args: unknown[]
  ) {
    try {
      const callback = this.extractLastArgument(args);

      // eslint-disable-next-line @typescript-eslint/return-await
      const response = await handler(...(args as TArgs));

      callback?.(response);
    } catch (err) {
      this.onError?.(err, event, args);
    }
  }

  private extractLastArgument(args: unknown[]): CallbackFunction | undefined {
    const lastArg = args.pop();
    if (typeof lastArg === 'function') {
      return lastArg as CallbackFunction;
    } else {
      // If the last argument is not a function, add it back to the args array
      args.push(lastArg);

      return undefined;
    }
  }
}
