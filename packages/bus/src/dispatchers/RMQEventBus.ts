import { RMQEventBusConfig } from './RMQEventBusConfig';
import {
  Command,
  Event,
  EventBus,
  EventHandler,
  EventHandlerConstructor,
  EventHandlerNotFound,
  IllegalOperation,
  NoResponse,
  NoSubscriptionsFound,
  RetryStrategy
} from '@sec-tester/core';
import type { Channel, ConsumeMessage } from 'amqplib';
import { autoInjectable, DependencyContainer, inject } from 'tsyringe';
import type {
  AmqpConnectionManager,
  AmqpConnectionManagerOptions,
  ChannelWrapper
} from 'amqp-connection-manager';
import { EventEmitter, once } from 'events';

interface ParsedConsumeMessage<T = unknown> {
  payload: T;
  name: string;
  replyTo?: string;
  correlationId?: string;
}

interface RawMessage<T = unknown> {
  payload: T;
  routingKey: string;
  exchange?: string;
  type?: string;
  correlationId?: string;
  replyTo?: string;
  timestamp?: Date;
}

interface Binding<T, R> {
  handler: EventHandler<T, R>;
  eventNames: string[];
}

@autoInjectable()
export class RMQEventBus implements EventBus {
  private channel: ChannelWrapper | undefined;
  private client: AmqpConnectionManager | undefined;

  private readonly DEFAULT_RECONNECT_TIME = 20;
  private readonly DEFAULT_HEARTBEAT_INTERVAL = 30;

  private readonly subject = new EventEmitter({ captureRejections: true });
  private readonly handlers = new Map<
    string,
    EventHandler<unknown, unknown>[]
  >();
  private readonly consumerTags: string[] = [];

  private readonly REPLY_QUEUE_NAME = 'amq.rabbitmq.reply-to';

  constructor(
    private readonly container: DependencyContainer,
    @inject(RetryStrategy)
    private readonly retryStrategy: RetryStrategy,
    @inject(RMQEventBusConfig) private readonly options: RMQEventBusConfig
  ) {
    this.subject.setMaxListeners(Infinity);
  }

  public async init(): Promise<void> {
    if (!this.client) {
      const url = this.buildUrl();
      const options = this.buildOptions();

      this.client = new (
        await import('amqp-connection-manager')
      ).AmqpConnectionManagerClass(url, options);

      await this.client.connect({
        timeout:
          (this.options.connectTimeout ?? this.DEFAULT_RECONNECT_TIME) * 1000
      });

      await this.createConsumerChannel();
    }
  }

  public async register<T, R>(
    type: EventHandlerConstructor<T, R>
  ): Promise<void> {
    const { handler, eventNames } = this.discoverEventBinding(type);

    await Promise.all(
      eventNames.map(eventName => this.subscribe(eventName, handler))
    );
  }

  public async unregister<T, R>(
    type: EventHandlerConstructor<T, R>
  ): Promise<void> {
    const { handler, eventNames } = this.discoverEventBinding(type);

    await Promise.all(
      eventNames.map(eventName => this.unsubscribe(eventName, handler))
    );
  }

  public async publish<T>(event: Event<T>): Promise<void> {
    const { type, payload, correlationId, createdAt } = event;

    await this.tryToSendMessage({
      type,
      payload,
      correlationId,
      routingKey: type,
      timestamp: createdAt,
      exchange: this.options.exchange
    });
  }

  public async execute<T, R>({
    type,
    payload,
    correlationId,
    createdAt,
    expectReply,
    ttl
  }: Command<T, R>): Promise<R | undefined> {
    const waiter = expectReply
      ? this.expectReply<R>(correlationId, ttl)
      : Promise.resolve(undefined);

    try {
      await this.tryToSendMessage({
        type,
        payload,
        correlationId,
        timestamp: createdAt,
        routingKey: this.options.appQueue,
        replyTo: this.REPLY_QUEUE_NAME
      });

      return await waiter;
    } finally {
      this.subject.removeAllListeners(correlationId);
    }
  }

  public async destroy(): Promise<void> {
    if (this.channel) {
      await Promise.all(
        this.consumerTags.map(consumerTag => this.channel?.cancel(consumerTag))
      );
      await this.channel.close();
    }

    if (this.client) {
      await (this.client as unknown as EventEmitter).removeAllListeners();
      await this.client.close();
    }

    delete this.channel;
    delete this.client;

    this.consumerTags.splice(0, this.consumerTags.length);
    this.subject.removeAllListeners();
  }

  private async subscribe<T, R>(
    eventName: string,
    handler: EventHandler<T, R>
  ): Promise<void> {
    const handlers = this.handlers.get(eventName);

    if (Array.isArray(handlers)) {
      handlers.push(handler);
    } else {
      this.handlers.set(eventName, [handler]);
      await this.bindQueue(eventName);
    }
  }

  private async bindQueue(eventName: string): Promise<void> {
    await this.getChannel().addSetup((channel: Channel) =>
      channel.bindQueue(
        this.options.clientQueue,
        this.options.exchange,
        eventName
      )
    );
  }

  private async unsubscribe<T, R>(
    eventName: string,
    handler: EventHandler<T, R>
  ): Promise<void> {
    const handlers = this.handlers.get(eventName);

    if (Array.isArray(handlers)) {
      const idx = handlers.indexOf(handler);

      if (idx !== -1) {
        handlers.splice(idx, 1);
      }

      if (!handlers.length) {
        this.handlers.delete(eventName);
        await this.unbindQueue(eventName);
      }
    }
  }

  private async unbindQueue(eventName: string) {
    await this.getChannel().removeSetup((channel: Channel) =>
      channel.unbindQueue(
        this.options.clientQueue,
        this.options.exchange,
        eventName
      )
    );
  }

  private discoverEventBinding<T, R>(
    type: EventHandlerConstructor<T, R>
  ): Binding<T, R> {
    const handler = this.resolveHandler(type);
    const eventNames = this.reflectEventsNames(type);

    if (!eventNames.length) {
      throw new NoSubscriptionsFound(handler);
    }

    return { handler, eventNames };
  }

  private resolveHandler<T, R>(
    type: EventHandlerConstructor<T, R>
  ): EventHandler<T, R> {
    const eventHandler = this.container.resolve(type);

    if (!eventHandler) {
      throw new EventHandlerNotFound(type.name);
    }

    return eventHandler;
  }

  private async expectReply<R>(
    correlationId: string,
    ttl: number = 5000
  ): Promise<R> {
    const result = await Promise.race([
      once(this.subject, correlationId) as Promise<[R]>,
      new Promise<never>((_, reject) =>
        setTimeout(reject, ttl, new NoResponse(ttl)).unref()
      )
    ]);

    const [response]: [R] = result;

    return response;
  }

  private reflectEventsNames(handlerType: EventHandlerConstructor): string[] {
    return Reflect.getMetadata(Event, handlerType) ?? [];
  }

  private async createConsumerChannel(): Promise<void> {
    if (!this.channel && this.client) {
      this.channel = this.client.createChannel({
        json: false
      });
      await this.channel.addSetup(async (channel: Channel) => {
        await this.bindExchangesToQueue(channel);
        await this.startBasicConsume(channel);
        await this.startReplyQueueConsume(channel);
      });
    }
  }

  private async startReplyQueueConsume(channel: Channel): Promise<void> {
    const { consumerTag } = await channel.consume(
      this.REPLY_QUEUE_NAME,
      (msg: ConsumeMessage | null) => (msg ? this.processReply(msg) : void 0),
      {
        noAck: true
      }
    );

    this.consumerTags.push(consumerTag);
  }

  private async startBasicConsume(channel: Channel): Promise<void> {
    const { consumerTag } = await channel.consume(
      this.options.clientQueue,
      (msg: ConsumeMessage | null) => (msg ? this.processMessage(msg) : void 0),
      {
        noAck: true
      }
    );

    this.consumerTags.push(consumerTag);
  }

  private async bindExchangesToQueue(channel: Channel): Promise<void> {
    await channel.assertExchange(this.options.exchange, 'direct', {
      durable: true
    });
    await channel.assertQueue(this.options.clientQueue, {
      durable: true,
      exclusive: false,
      autoDelete: true
    });
    await channel.prefetch(this.options.prefetchCount ?? 1);
  }

  private processReply(message: ConsumeMessage | null): void {
    const event: ParsedConsumeMessage | undefined =
      this.parseConsumeMessage(message);

    if (event?.correlationId) {
      this.subject.emit(event.correlationId, event.payload);
    }
  }

  private async processMessage(message: ConsumeMessage | null): Promise<void> {
    const event: ParsedConsumeMessage | undefined =
      this.parseConsumeMessage(message);

    if (event) {
      const handlers = this.handlers.get(event.name);

      if (!handlers) {
        throw new EventHandlerNotFound(event.name);
      }

      await Promise.all(
        handlers.map(handler => this.handleEvent(handler, event))
      );
    }
  }

  private async handleEvent(
    handler: EventHandler<unknown, unknown>,
    event: ParsedConsumeMessage
  ): Promise<void> {
    try {
      const response = await handler.handle(event.payload);

      if (response && event.replyTo) {
        await this.tryToSendMessage({
          payload: response,
          routingKey: event.replyTo,
          correlationId: event.correlationId
        });
      }
    } catch {
      // noop
    }
  }

  private async tryToSendMessage(options: RawMessage): Promise<void> {
    await this.retryStrategy.acquire(() => this.sendMessage(options));
  }

  private async sendMessage(options: RawMessage): Promise<void> {
    const {
      type,
      payload,
      replyTo,
      routingKey,
      correlationId,
      exchange = '',
      timestamp = new Date()
    } = options;

    await this.getChannel().publish(
      exchange ?? '',
      routingKey,
      Buffer.from(JSON.stringify(payload)),
      {
        type,
        replyTo,
        correlationId,
        mandatory: true,
        persistent: true,
        contentType: 'application/json',
        timestamp: timestamp?.getTime()
      }
    );
  }

  private parseConsumeMessage(
    message: ConsumeMessage | null
  ): ParsedConsumeMessage | undefined {
    if (message && !message.fields.redelivered) {
      const { content, fields, properties } = message;
      const { type, correlationId, replyTo } = properties;
      const { routingKey } = fields;

      const name = type ?? routingKey;

      const payload = JSON.parse(content.toString());

      return { payload, name, correlationId, replyTo };
    }
  }

  private buildOptions(): AmqpConnectionManagerOptions {
    const { reconnectTime, heartbeatInterval, credentials } = this.options;

    return {
      heartbeatIntervalInSeconds:
        heartbeatInterval ?? this.DEFAULT_HEARTBEAT_INTERVAL,
      reconnectTimeInSeconds: reconnectTime ?? this.DEFAULT_RECONNECT_TIME,
      connectionOptions: {
        ...(credentials
          ? { credentials: this.createAuthRequest(credentials) }
          : {})
      }
    };
  }

  private createAuthRequest(plain: { username: string; password: string }): {
    password: string;
    response(): Buffer;
    mechanism: 'PLAIN';
    username: string;
  } {
    return {
      ...plain,
      mechanism: 'PLAIN',
      /* istanbul ignore next */
      response(): Buffer {
        return Buffer.from(
          ['', plain.username, plain.password].join(String.fromCharCode(0))
        );
      }
    };
  }

  private buildUrl(): string {
    const url = new URL(this.options.url);

    const { frameMax } = this.options;

    if (frameMax !== null && frameMax !== undefined) {
      url.searchParams.append('frameMax', frameMax.toString(10));
    }

    return url.toString();
  }

  private getChannel(): NonNullable<ChannelWrapper> {
    if (!this.channel) {
      throw new IllegalOperation(this);
    }

    return this.channel;
  }
}
