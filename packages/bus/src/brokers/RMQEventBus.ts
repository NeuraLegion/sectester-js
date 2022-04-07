import { ConnectionFactory } from '../factories';
import {
  Command,
  Event,
  EventBus,
  EventHandler,
  NoResponse,
  Configuration,
  Credentials,
  EventHandlerConstructor,
  EventBusConfig,
  IllegalOperation,
  EventHandlerNotFound,
  NoSubscriptionsFound
} from '@secbox/core';
import { ConfirmChannel, Connection, ConsumeMessage } from 'amqplib';
import { DependencyContainer, inject, injectable } from 'tsyringe';
import { EventEmitter, once } from 'events';
import { format, parse, UrlWithParsedQuery } from 'url';

interface ParsedConsumeMessage<T = unknown> {
  payload: T;
  name: string;
  replyTo?: string;
  correlationId?: string;
}

@injectable()
export class RMQEventBus implements EventBus {
  private client?: Connection;
  private channel?: ConfirmChannel;

  private readonly subject = new EventEmitter({ captureRejections: true });
  private readonly handlers = new Map<
    string,
    EventHandler<unknown, unknown>[]
  >();
  private readonly consumerTags: string[] = [];
  private readonly container: DependencyContainer;

  private readonly REPLY_QUEUE_NAME = 'amq.rabbitmq.reply-to';
  private readonly APP_QUEUE_NAME = 'app';

  constructor(
    @inject(Configuration) private readonly sdkConfig: Configuration,
    @inject(EventBusConfig) private readonly busConfig: EventBusConfig,
    @inject(ConnectionFactory)
    private readonly connectionFactory: ConnectionFactory<Connection>
  ) {
    this.container = sdkConfig.container;
    this.subject.setMaxListeners(Infinity);
  }

  public async init(): Promise<void> {
    const timeout = this.busConfig.connectTimeout;
    const heartbeat = this.busConfig.heartbeatInterval;
    const credentials = this.sdkConfig.credentials;
    const url = this.sdkConfig.bus;

    const buildedUrl = this.buildUrl({
      url,
      credentials,
      heartbeat: heartbeat ?? 5000
    });

    this.client = await this.connectionFactory.create(buildedUrl, {
      timeout
    });

    this.client.on('close', (reason?: Error) =>
      reason ? this.reconnect() : undefined
    );

    await this.createConsumerChannel();
  }

  public async register<T, R>(
    type: EventHandlerConstructor<T, R>
  ): Promise<void> {
    if (!this.channel) {
      throw new IllegalOperation(this);
    }

    const handlerInstance = this.getHandlerInstance(type);

    const eventNames: string[] = this.reflectEventsNames(type);

    await Promise.all(
      eventNames.map(eventName =>
        this.registerEventHandler(handlerInstance, eventName)
      )
    );
  }

  public async unregister<T, R>(
    type: EventHandlerConstructor<T, R>
  ): Promise<void> {
    if (!this.channel) {
      throw new IllegalOperation(this);
    }

    const handlerInstance = this.getHandlerInstance(type);

    const eventNames: string[] = this.reflectEventsNames(type);

    await Promise.all(
      eventNames.map(eventName =>
        this.unregisterEventHandler(handlerInstance, eventName)
      )
    );
  }

  public async publish<T>(event: Event<T>): Promise<void> {
    if (!this.channel) {
      throw new IllegalOperation(this);
    }

    const { type, payload, correlationId, createdAt } = event;

    await this.channel?.publish(
      this.busConfig.exchange,
      type,
      Buffer.from(JSON.stringify(payload)),
      {
        type,
        correlationId,
        contentType: 'application/json',
        mandatory: true,
        persistent: true,
        replyTo: this.REPLY_QUEUE_NAME,
        timestamp: createdAt.getTime()
      }
    );
  }

  public async execute<T, R>(command: Command<T, R>): Promise<R> {
    const { correlationId, ttl, expectReply } = command;

    let waiter = Promise.resolve<unknown>(undefined);

    if (expectReply) {
      process.nextTick(() => {
        waiter = this.expectReply<R>(correlationId, ttl);
      });
    }

    try {
      this.sendCommandToQueue(command);

      return (await waiter) as R;
    } finally {
      this.subject.removeAllListeners(correlationId);
    }
  }

  public async destroy(): Promise<void> {
    if (!this.client) {
      throw new IllegalOperation(this);
    }

    if (this.channel) {
      await this.channel.waitForConfirms();
      await Promise.all(
        this.consumerTags.map(consumerTag => this.channel?.cancel(consumerTag))
      );
      await this.channel.close();
    }

    await this.client.close();
    this.clear();
  }

  private async registerEventHandler<T, R>(
    handlerInstance: EventHandler<T, R>,
    eventName: string
  ) {
    const eventHandlers = this.handlers.get(eventName);
    if (Array.isArray(eventHandlers)) {
      eventHandlers.push(handlerInstance);
    } else {
      this.handlers.set(eventName, [handlerInstance]);
      await this.bindQueue(eventName);
    }
  }

  private async bindQueue(eventName: string) {
    if (!this.channel) {
      throw new IllegalOperation(this);
    }

    await this.channel.bindQueue(
      this.busConfig.clientQueue,
      this.busConfig.exchange,
      eventName
    );
  }

  private async unregisterEventHandler<T, R>(
    handlerInstance: EventHandler<T, R>,
    eventName: string
  ) {
    const eventHandlers = this.handlers.get(eventName);
    if (!eventHandlers) {
      return;
    }

    const handlerIndex = eventHandlers.findIndex(
      e =>
        Object.getPrototypeOf(e).constructor.name ===
        Object.getPrototypeOf(handlerInstance).constructor.name
    );
    if (handlerIndex !== -1) {
      eventHandlers.splice(handlerIndex, 1);
    }

    if (eventHandlers.length === 0) {
      this.handlers.delete(eventName);
      await this.unbindQueue(eventName);
    }
  }

  private async unbindQueue(eventName: string) {
    if (!this.channel) {
      throw new IllegalOperation(this);
    }

    await this.channel.unbindQueue(
      this.busConfig.clientQueue,
      this.busConfig.exchange,
      eventName
    );
  }

  private sendCommandToQueue<T, R>(command: Command<T, R>) {
    if (!this.channel) {
      throw new IllegalOperation(this);
    }

    const { type, payload, correlationId, createdAt } = command;

    this.channel.sendToQueue(
      this.APP_QUEUE_NAME,
      Buffer.from(JSON.stringify(payload)),
      {
        type,
        correlationId,
        contentType: 'application/json',
        mandatory: true,
        persistent: true,
        timestamp: createdAt.getTime(),
        replyTo: this.REPLY_QUEUE_NAME
      }
    );
  }

  private getHandlerInstance<T, R>(
    type: EventHandlerConstructor<T, R>
  ): EventHandler<T, R> {
    if (!this.container.isRegistered(type)) {
      throw new EventHandlerNotFound(type.name);
    }

    return this.container.resolve(type);
  }

  private expectReply<R>(correlationId: string, ttl: number): Promise<R> {
    return Promise.race([
      once(this.subject, correlationId)[0] as Promise<R>,
      new Promise<never>((_, reject) =>
        setTimeout(reject, ttl, new NoResponse(ttl)).unref()
      )
    ]);
  }

  private async reconnect(): Promise<void> {
    try {
      this.clear();
      await this.init();
    } catch (err) {
      // add log
    }
  }

  private reflectEventsNames(
    handler: EventHandlerConstructor<unknown, unknown>
  ): string[] {
    const types: (new (...args: unknown[]) => Event<unknown>)[] =
      Reflect.getMetadata(Event, handler) ?? [];

    if (!types.length) {
      throw new NoSubscriptionsFound(handler);
    }

    return types.map(
      (event: new (...args: unknown[]) => Event<unknown> | string) =>
        typeof event === 'string' ? event : event.name
    );
  }

  private async createConsumerChannel(): Promise<void> {
    if (this.channel || !this.client) {
      throw new IllegalOperation(this);
    }

    this.channel = await this.client.createConfirmChannel();

    await this.bindExchangesToQueue();
    await this.startBasicConsume();
    await this.startReplyQueueConsume();
  }

  private async startReplyQueueConsume(): Promise<void> {
    if (!this.channel) {
      throw new IllegalOperation(this);
    }

    const { consumerTag } = await this.channel.consume(
      this.REPLY_QUEUE_NAME,
      (msg: ConsumeMessage | null) => this.processReply(msg),
      {
        noAck: true
      }
    );

    this.consumerTags.push(consumerTag);
  }

  private async startBasicConsume(): Promise<void> {
    if (!this.channel) {
      throw new IllegalOperation(this);
    }

    const { consumerTag } = await this.channel.consume(
      this.busConfig.clientQueue,
      (msg: ConsumeMessage | null) => this.consumeReceived(msg),
      {
        noAck: true
      }
    );

    this.consumerTags.push(consumerTag);
  }

  private async bindExchangesToQueue(): Promise<void> {
    if (!this.channel) {
      throw new IllegalOperation(this);
    }

    await this.channel.assertExchange(this.busConfig.exchange, 'direct', {
      durable: true
    });

    await this.channel.assertQueue(this.busConfig.clientQueue, {
      durable: true,
      exclusive: false,
      autoDelete: true
    });
  }

  private processReply(message: ConsumeMessage | null): void {
    const event: ParsedConsumeMessage | undefined =
      this.parseConsumeMessage(message);

    if (event?.correlationId) {
      this.subject.emit(event.correlationId, event.payload);
    }
  }

  private async consumeReceived(message: ConsumeMessage | null): Promise<void> {
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
      await this.sendToQueue(event, response);
    } catch {
      // TODO: add logs
    }
  }

  private sendToQueue(event: ParsedConsumeMessage, response: unknown) {
    if (!this.channel) {
      throw new IllegalOperation(this);
    }

    if (!response || !event.replyTo) {
      return;
    }

    this.channel.sendToQueue(
      event.replyTo,
      Buffer.from(JSON.stringify(response)),
      {
        mandatory: true,
        persistent: true,
        contentType: 'application/json',
        correlationId: event.correlationId
      }
    );
  }

  private parseConsumeMessage(
    message: ConsumeMessage | null
  ): ParsedConsumeMessage | undefined {
    if (message && message.fields.redelivered) {
      const { content, fields, properties } = message;
      const { type, correlationId, replyTo } = properties;
      const { routingKey } = fields;

      const name = type ?? routingKey;

      const payload: unknown = JSON.parse(content.toString());

      return { payload, name, correlationId, replyTo };
    }
  }

  private clear(): void {
    if (!this.channel || !this.client) {
      throw new IllegalOperation(this);
    }

    this.consumerTags.splice(0, this.consumerTags.length);

    this.channel.removeAllListeners();
    delete this.channel;

    this.client.removeAllListeners();
    delete this.client;
  }

  private buildUrl(options: {
    url: string;
    credentials: Credentials | undefined;
    heartbeat: number;
  }): string {
    const parsedUrl: UrlWithParsedQuery = parse(options.url, true);

    if (options.credentials) {
      const credentials: Credentials = options.credentials;
      parsedUrl.auth = `${credentials.username}:${credentials.token}`;
    }

    parsedUrl.query = {
      ...parsedUrl.query,
      frameMax: '0',
      heartbeat: options.heartbeat.toString()
    };

    return format(parsedUrl);
  }
}
