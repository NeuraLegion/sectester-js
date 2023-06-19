import { RMQEventBusConfig } from './RMQEventBusConfig';
import { RMQConnectionManager } from './RMQConnectionManager';
import {
  Command,
  Event,
  EventBus,
  EventHandler,
  EventHandlerConstructor,
  EventHandlerNotFound,
  IllegalOperation,
  Logger,
  NoResponse,
  NoSubscriptionsFound,
  RetryStrategy
} from '@sectester/core';
import type { Channel, ConsumeMessage } from 'amqplib';
import { autoInjectable, DependencyContainer, inject } from 'tsyringe';
import type { ChannelWrapper } from 'amqp-connection-manager';
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

  private readonly subject = new EventEmitter({ captureRejections: true });
  private readonly handlers = new Map<
    string,
    EventHandler<unknown, unknown>[]
  >();
  private readonly REPLY_QUEUE_NAME = 'amq.rabbitmq.reply-to';

  constructor(
    private readonly container: DependencyContainer,
    private readonly logger: Logger,
    @inject(RetryStrategy)
    private readonly retryStrategy: RetryStrategy,
    @inject(RMQEventBusConfig) private readonly options: RMQEventBusConfig,
    @inject(RMQConnectionManager)
    private readonly connectionManager: RMQConnectionManager
  ) {
    this.subject.setMaxListeners(Infinity);
  }

  public async init(): Promise<void> {
    if (!this.channel) {
      this.channel = this.connectionManager.createChannel();

      await this.channel.addSetup(async (channel: Channel) => {
        await this.bindExchangesToQueue(channel);
        await this.startBasicConsume(channel);
        await this.startReplyQueueConsume(channel);
      });
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
    try {
      if (this.channel) {
        await this.channel.cancelAll();
        await this.channel.close();
      }

      delete this.channel;

      this.subject.removeAllListeners();
    } catch (e) {
      this.logger.error('Cannot terminate event bus gracefully');
      this.logger.debug('Event bus terminated');
      this.logger.debug('Error on disconnect: %s', e.message);
    }
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
    this.logger.debug(
      'Bind the queue (%s) to the exchange (%s) by the routing key (%s).',
      this.options.clientQueue,
      this.options.exchange,
      eventName
    );
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
    this.logger.debug(
      'Unbind the queue (%s) to the exchange (%s) by the routing key (%s).',
      this.options.clientQueue,
      this.options.exchange,
      eventName
    );
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

  private async startReplyQueueConsume(channel: Channel): Promise<void> {
    await channel.consume(
      this.REPLY_QUEUE_NAME,
      (msg: ConsumeMessage | null) => (msg ? this.processReply(msg) : void 0),
      {
        noAck: true
      }
    );
  }

  private async startBasicConsume(channel: Channel): Promise<void> {
    await channel.consume(
      this.options.clientQueue,
      async (msg: ConsumeMessage | null) => {
        try {
          if (msg) {
            await this.processMessage(msg);
          }
        } catch (e) {
          this.logger.error(
            'Error while processing a message due to error occurred: ',
            e
          );
        }
      },
      {
        noAck: true
      }
    );
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
      this.logger.debug(
        'Received a reply (%s) with following payload: %j',
        event.correlationId,
        event.payload
      );

      this.subject.emit(event.correlationId, event.payload);
    } else {
      this.logger.debug(
        'Error while processing a reply. The correlation ID not found. Reply: %j',
        event
      );
    }
  }

  private async processMessage(message: ConsumeMessage | null): Promise<void> {
    const event: ParsedConsumeMessage | undefined =
      this.parseConsumeMessage(message);

    if (event) {
      this.logger.debug(
        'Received a event (%s) with following payload: %j',
        event.name,
        event.payload
      );

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
        this.logger.debug(
          'Sending a reply (%s) back with following payload: %j',
          event.name,
          event.payload
        );

        await this.tryToSendMessage({
          payload: response,
          routingKey: event.replyTo,
          correlationId: event.correlationId
        });
      }
    } catch (e) {
      this.logger.error(
        'Error occurred while precessing a message (%s)',
        event.correlationId,
        e
      );
      this.logger.debug('Failed message (%s): %j', event.correlationId, event);
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

    this.logger.debug('Send a message with following parameters: %j', options);

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

  private getChannel(): NonNullable<ChannelWrapper> {
    if (!this.channel) {
      throw new IllegalOperation(this);
    }

    return this.channel;
  }
}
