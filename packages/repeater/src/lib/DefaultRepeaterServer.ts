import 'reflect-metadata';
import {
  RepeaterServer,
  RepeaterServerEventHandler,
  RepeaterServerEventsMap,
  CallbackFunction,
  DeployCommandOptions,
  RepeaterErrorCodes,
  RepeaterServerDeployedEvent,
  RepeaterServerErrorEvent,
  RepeaterServerEvents,
  RepeaterServerReconnectionAttemptedEvent,
  RepeaterServerReconnectionFailedEvent,
  RepeaterServerRequestEvent,
  RepeaterServerRequestResponse,
  RepeaterUpgradeAvailableEvent,
  HandlerFunction
} from './RepeaterServer';
import { Logger } from '@sectester/core';
import { inject, injectable, Lifecycle, scoped } from 'tsyringe';
import io, { Socket } from 'socket.io-client';
import parser from 'socket.io-msgpack-parser';
import { ErrorEvent } from 'ws';
import { EventEmitter, once } from 'events';
import Timer = NodeJS.Timer;

export interface DefaultRepeaterServerOptions {
  readonly uri: string;
  readonly token: string;
  readonly connectTimeout?: number;
  readonly proxyUrl?: string;
}

export const DefaultRepeaterServerOptions: unique symbol = Symbol(
  'DefaultRepeaterServerOptions'
);

export const enum SocketEvents {
  DEPLOYED = 'deployed',
  DEPLOY = 'deploy',
  UNDEPLOY = 'undeploy',
  UNDEPLOYED = 'undeployed',
  ERROR = 'error',
  UPDATE_AVAILABLE = 'update-available',
  PING = 'ping',
  REQUEST = 'request'
}

interface SocketListeningEventMap {
  [SocketEvents.DEPLOYED]: (event: RepeaterServerDeployedEvent) => void;
  [SocketEvents.UNDEPLOYED]: () => void;
  [SocketEvents.ERROR]: (event: RepeaterServerErrorEvent) => void;
  [SocketEvents.UPDATE_AVAILABLE]: (
    event: RepeaterUpgradeAvailableEvent
  ) => void;
  [SocketEvents.REQUEST]: (
    request: RepeaterServerRequestEvent,
    callback: CallbackFunction<RepeaterServerRequestResponse>
  ) => void;
}

interface SocketEmitEventMap {
  [SocketEvents.DEPLOY]: (options: DeployCommandOptions) => void;
  [SocketEvents.UNDEPLOY]: () => void;
  [SocketEvents.PING]: () => void;
}

@scoped(Lifecycle.ContainerScoped)
@injectable()
export class DefaultRepeaterServer implements RepeaterServer {
  private readonly MAX_DEPLOYMENT_TIMEOUT = 60_000;
  private readonly MAX_PING_INTERVAL = 10_000;
  private readonly MAX_RECONNECTION_ATTEMPTS = 20;
  private readonly MIN_RECONNECTION_DELAY = 1000;
  private readonly MAX_RECONNECTION_DELAY = 86_400_000;

  private latestReconnectionError?: Error;
  private pingTimer?: Timer;
  private connectionTimer?: Timer;
  private _socket?: Socket<SocketListeningEventMap, SocketEmitEventMap>;
  private connectionAttempts = 0;
  private events = new EventEmitter();

  private readonly handlerMap = new WeakMap<
    RepeaterServerEventHandler<any>,
    HandlerFunction
  >();

  private get socket() {
    if (!this._socket) {
      throw new Error(
        'Please make sure that repeater established a connection with host.'
      );
    }

    return this._socket;
  }

  constructor(
    private readonly logger: Logger,
    @inject(DefaultRepeaterServerOptions)
    private readonly options: DefaultRepeaterServerOptions
  ) {}

  public disconnect() {
    this.events.removeAllListeners();
    this.clearPingTimer();
    this.clearConnectionTimer();

    this._socket?.disconnect();
    this._socket?.removeAllListeners();
    this._socket = undefined;
  }

  public async deploy(
    options: DeployCommandOptions = {}
  ): Promise<RepeaterServerDeployedEvent> {
    process.nextTick(() => this.socket.emit(SocketEvents.DEPLOY, options));

    const [result]: RepeaterServerDeployedEvent[] = await Promise.race([
      once(this.socket, SocketEvents.DEPLOYED),
      new Promise<never>((_, reject) =>
        setTimeout(
          reject,
          this.MAX_DEPLOYMENT_TIMEOUT,
          new Error('No response.')
        ).unref()
      )
    ]);

    this.createPingTimer();

    return result;
  }

  public async connect(domain: string) {
    this._socket = io(this.options.uri, {
      parser,
      path: '/api/ws/v1',
      transports: ['websocket'],
      reconnectionAttempts: this.MAX_RECONNECTION_ATTEMPTS,
      auth: {
        domain,
        token: this.options.token
      }
    });

    this.listenToReservedEvents();
    this.listenToApplicationEvents();

    await once(this.socket, 'connect');

    this.logger.debug('Repeater connected to %s', this.options.uri);
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
      this.handleEventError(err, event, args);
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

  private listenToApplicationEvents() {
    this.socket.on(SocketEvents.DEPLOYED, event => {
      this.events.emit(RepeaterServerEvents.DEPLOY, event);
    });
    this.socket.on(SocketEvents.REQUEST, (event, callback) =>
      this.events.emit(RepeaterServerEvents.REQUEST, event, callback)
    );
    this.socket.on(SocketEvents.ERROR, event => {
      this.events.emit(RepeaterServerEvents.ERROR, event);
    });
    this.socket.on(SocketEvents.UPDATE_AVAILABLE, event =>
      this.events.emit(RepeaterServerEvents.UPDATE_AVAILABLE, event)
    );
  }

  private listenToReservedEvents() {
    this.socket.on('connect', this.handleConnect);
    this.socket.on('connect_error', this.handleConnectionError);
    this.socket.on('disconnect', this.handleDisconnect);
    this.socket.io.on('reconnect', () => {
      this.latestReconnectionError = undefined;
    });
    this.socket.io.on(
      'reconnect_error',
      error => (this.latestReconnectionError = error)
    );
    this.socket.io.on('reconnect_failed', () =>
      this.events.emit(RepeaterServerEvents.RECONNECTION_FAILED, {
        error: this.latestReconnectionError
      } as RepeaterServerReconnectionFailedEvent)
    );
    this.socket.io.on('reconnect_attempt', attempt =>
      this.events.emit(RepeaterServerEvents.RECONNECT_ATTEMPT, {
        attempt,
        maxAttempts: this.MAX_RECONNECTION_ATTEMPTS
      } as RepeaterServerReconnectionAttemptedEvent)
    );
    this.socket.io.on('reconnect', () =>
      this.events.emit(RepeaterServerEvents.RECONNECTION_SUCCEEDED)
    );
  }

  private handleConnectionError = (err: Error) => {
    const { data } = err as unknown as {
      data?: Omit<RepeaterServerErrorEvent, 'transaction'>;
    };

    // If the error is not related to the repeater, we should ignore it
    if (!data?.code) {
      this.logConnectionError(err);

      return;
    }

    if (this.suppressConnectionError(data)) {
      this.events.emit(RepeaterServerEvents.ERROR, {
        ...data,
        message: err.message
      });

      return;
    }

    if (this.connectionAttempts >= this.MAX_RECONNECTION_ATTEMPTS) {
      this.events.emit(RepeaterServerEvents.RECONNECTION_FAILED, {
        error: err
      } as RepeaterServerReconnectionFailedEvent);

      return;
    }

    // If the error is not related to the authentication, we should manually reconnect
    this.scheduleReconnection();
  };

  private suppressConnectionError(
    data: Omit<RepeaterServerErrorEvent, 'transaction'>
  ) {
    return [
      RepeaterErrorCodes.REPEATER_UNAUTHORIZED,
      RepeaterErrorCodes.REPEATER_NOT_PERMITTED
    ].includes(data.code);
  }

  private scheduleReconnection() {
    let delay = Math.max(
      this.MIN_RECONNECTION_DELAY * 2 ** this.connectionAttempts,
      this.MIN_RECONNECTION_DELAY
    );
    delay += delay * 0.3 * Math.random();
    delay = Math.min(delay, this.MAX_RECONNECTION_DELAY);

    this.connectionAttempts++;

    this.events.emit(RepeaterServerEvents.RECONNECT_ATTEMPT, {
      attempt: this.connectionAttempts,
      maxAttempts: this.MAX_RECONNECTION_ATTEMPTS
    } as RepeaterServerReconnectionAttemptedEvent);
    this.connectionTimer = setTimeout(() => this.socket.connect(), delay);
  }

  private logConnectionError(err: Error) {
    this.logger.debug(
      'An error occurred while connecting to the repeater: %s',
      err.message
    );

    const { description, cause } = err as {
      description?: ErrorEvent;
      cause?: Error;
    };
    const nestedError = description?.error ?? cause;

    if (nestedError) {
      this.logger.debug('The error cause: %s', nestedError.message);
    }
  }

  private clearConnectionTimer() {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
    }
  }

  private handleConnect = () => {
    this.connectionAttempts = 0;
    this.clearConnectionTimer();
    this.events.emit(RepeaterServerEvents.CONNECTED);
  };

  private handleDisconnect = (reason: string): void => {
    this.clearPingTimer();

    if (reason !== 'io client disconnect') {
      this.events.emit(RepeaterServerEvents.DISCONNECTED);
    }

    // the disconnection was initiated by the server, you need to reconnect manually
    if (reason === 'io server disconnect') {
      this.socket.connect();
    }
  };

  private handleEventError(error: Error, event: string, args: unknown[]): void {
    this.logger.debug(
      'An error occurred while processing the %s event with the following payload: %j',
      event,
      args
    );
    this.logger.error('An error occurred', error);
  }

  private createPingTimer() {
    this.clearPingTimer();

    this.pingTimer = setInterval(
      () => this.socket.volatile.emit(SocketEvents.PING),
      this.MAX_PING_INTERVAL
    ).unref();
  }

  private clearPingTimer() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }
  }
}
