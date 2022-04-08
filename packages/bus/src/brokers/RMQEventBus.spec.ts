/* eslint-disable max-classes-per-file */
import { RMQEventBus } from './RMQEventBus';
import { RMQEventBusConfig } from './RMQEventBusConfig';
import {
  bind,
  Command,
  Configuration,
  Event,
  EventHandler,
  NoResponse
} from '@secbox/core';
import {
  anyFunction,
  anyOfClass,
  anyString,
  anything,
  deepEqual,
  instance,
  mock,
  objectContaining,
  reset,
  resetCalls,
  spy,
  verify,
  when
} from 'ts-mockito';
import { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { Channel, ConsumeMessage } from 'amqplib';
import { DependencyContainer } from 'tsyringe';

class ConcreteCommand extends Command<string, void> {
  constructor(
    payload: string,
    expectReply?: boolean,
    ttl?: number,
    type?: string,
    correlationId?: string,
    createdAt?: Date
  ) {
    super(payload, expectReply, ttl, type, correlationId, createdAt);
  }
}

class ConcreteEvent extends Event<{ foo: string }> {
  constructor(
    payload: { foo: string },
    type?: string,
    correlationId?: string,
    createdAt?: Date
  ) {
    super(payload, type, correlationId, createdAt);
  }
}

@bind(ConcreteEvent)
class ConcreteFirstHandler
  implements EventHandler<{ foo: string }, { bar: string }>
{
  public handle(_: { foo: string }): Promise<{ bar: string } | undefined> {
    return Promise.resolve(undefined);
  }
}

@bind(ConcreteEvent)
class ConcreteSecondHandler implements EventHandler<{ foo: string }> {
  public async handle(_: { foo: string }): Promise<void> {
    // noop
  }
}

class ConcreteThirdHandler implements EventHandler<{ foo: string }> {
  public async handle(_: { foo: string }): Promise<void> {
    // noop
  }
}

describe('RMQEventBus', () => {
  const mockedConnectionManager = mock<AmqpConnectionManager>();
  const mockedChannelWrapper = mock<ChannelWrapper>();
  const mockedChannel = mock<Channel>();
  const mockedConfiguration = mock<Configuration>();
  const mockedDependencyContainer = mock<DependencyContainer>();
  const options: RMQEventBusConfig = {
    url: 'amqp://localhost:5672',
    exchange: 'event-bus',
    clientQueue: 'Agent',
    appQueue: 'App'
  };
  const spiedOptions = spy(options);

  let rmq!: RMQEventBus;

  beforeEach(() => {
    jest.mock('amqp-connection-manager', () => ({
      connect: jest.fn().mockReturnValue(instance(mockedConnectionManager))
    }));
    when(mockedConnectionManager.createChannel(anything())).thenReturn(
      instance(mockedChannelWrapper)
    );
    when(mockedChannelWrapper.addSetup(anyFunction())).thenCall(
      (callback: (...args: unknown[]) => unknown) =>
        callback(instance(mockedChannel))
    );
    when(
      mockedChannel.consume(anyString(), anyFunction(), anything())
    ).thenResolve({ consumerTag: 'tag' } as any);
    when(mockedConfiguration.container).thenReturn(
      instance(mockedDependencyContainer)
    );
    rmq = new RMQEventBus(instance(mockedConfiguration), options);
  });

  afterEach(() => {
    (rmq as any).handlers.clear();
    reset<
      | ChannelWrapper
      | AmqpConnectionManager
      | Channel
      | RMQEventBusConfig
      | DependencyContainer
      | Configuration
    >(
      mockedConnectionManager,
      mockedChannelWrapper,
      mockedChannel,
      spiedOptions,
      mockedConfiguration,
      mockedDependencyContainer
    );
    jest.resetModules();
    jest.resetAllMocks();
  });

  describe('execute', () => {
    it('should throw an error if client is not initialized yet', async () => {
      // arrange
      const command = new ConcreteCommand('test');

      // act
      const result = rmq.execute(command);

      // assert
      await expect(result).rejects.toThrow(
        'established a connection with host'
      );
    });

    it('should send a message to queue', async () => {
      // arrange
      const command = new ConcreteCommand('test', false);
      when(
        mockedChannelWrapper.sendToQueue(
          anyString(),
          anyOfClass(Buffer),
          anything()
        )
      ).thenResolve();

      await rmq.init();

      // act
      const result = await rmq.execute(command);

      // assert
      expect(result).toBeUndefined();
      verify(
        mockedChannelWrapper.publish(
          '',
          options.appQueue,
          anyOfClass(Buffer),
          deepEqual({
            type: command.type,
            mandatory: true,
            persistent: true,
            contentType: 'application/json',
            timestamp: command.createdAt.getTime(),
            correlationId: command.correlationId,
            replyTo: 'amq.rabbitmq.reply-to'
          })
        )
      ).once();
    });

    it('should send a message to queue and get a reply', async () => {
      // arrange
      const command = new ConcreteCommand('test');
      when(
        mockedChannelWrapper.sendToQueue(
          anyString(),
          anyOfClass(Buffer),
          anything()
        )
      ).thenResolve();
      let processMessage!: (msg: ConsumeMessage | null) => Promise<unknown>;
      when(
        mockedChannel.consume(
          'amq.rabbitmq.reply-to',
          anyFunction(),
          anything()
        )
      ).thenCall(
        (
          _: string,
          callback: (msg: ConsumeMessage | null) => Promise<unknown>
        ) => (processMessage = callback)
      );

      const payload = { foo: 'bar' };
      const message = {
        content: Buffer.from(JSON.stringify(payload)),
        fields: {
          redelivered: false,
          routingKey: ConcreteEvent.name
        },
        properties: {
          type: ConcreteEvent.name,
          correlationId: command.correlationId
        }
      } as ConsumeMessage;

      await rmq.init();

      process.nextTick(() => processMessage(message));

      // act
      const result = await rmq.execute(command);

      // assert
      expect(result).toEqual(payload);
      verify(
        mockedChannelWrapper.publish(
          '',
          options.appQueue,
          anyOfClass(Buffer),
          deepEqual({
            type: command.type,
            mandatory: true,
            persistent: true,
            contentType: 'application/json',
            timestamp: command.createdAt.getTime(),
            correlationId: command.correlationId,
            replyTo: 'amq.rabbitmq.reply-to'
          })
        )
      ).once();
    });

    it('should throw a error if no response', async () => {
      // arrange
      const command = new ConcreteCommand('test', true, 1);
      when(
        mockedChannelWrapper.sendToQueue(
          anyString(),
          anyOfClass(Buffer),
          anything()
        )
      ).thenResolve();

      await rmq.init();

      // act
      const result = rmq.execute(command);

      // assert
      verify(
        mockedChannelWrapper.publish(
          '',
          options.appQueue,
          anyOfClass(Buffer),
          deepEqual({
            type: command.type,
            mandatory: true,
            persistent: true,
            contentType: 'application/json',
            timestamp: command.createdAt.getTime(),
            correlationId: command.correlationId,
            replyTo: 'amq.rabbitmq.reply-to'
          })
        )
      ).once();
      await expect(result).rejects.toThrow(NoResponse);
    });
  });

  describe('init', () => {
    afterEach(() => jest.useRealTimers());

    it('should skip initialization if client is already initialized', async () => {
      // arrange
      await rmq.init();

      // act
      await rmq.init();

      // assert
      verify(
        mockedConnectionManager.createChannel(
          deepEqual({
            json: false
          })
        )
      ).once();
    });

    it('should create a channel', async () => {
      // act
      await rmq.init();

      // assert
      verify(
        mockedConnectionManager.createChannel(
          deepEqual({
            json: false
          })
        )
      ).once();
    });

    it('should consume regular messages', async () => {
      // arrange
      when(
        mockedChannel.consume(anyString(), anyFunction(), anything())
      ).thenResolve({ consumerTag: 'tag' } as any);

      // act
      await rmq.init();

      // assert
      verify(
        mockedChannel.consume(
          options.clientQueue,
          anyFunction(),
          deepEqual({
            noAck: true
          })
        )
      ).once();
    });

    it('should consume reply messages', async () => {
      // arrange
      when(
        mockedChannel.consume(anyString(), anyFunction(), anything())
      ).thenResolve({ consumerTag: 'tag' } as any);

      // act
      await rmq.init();

      // assert
      verify(
        mockedChannel.consume(
          'amq.rabbitmq.reply-to',
          anyFunction(),
          deepEqual({
            noAck: true
          })
        )
      ).once();
    });

    it('should bind exchanges to queue', async () => {
      // act
      await rmq.init();

      // assert
      verify(
        mockedChannel.assertExchange(
          options.exchange,
          'direct',
          deepEqual({
            durable: true
          })
        )
      ).once();
      verify(
        mockedChannel.assertQueue(
          options.clientQueue,
          deepEqual({
            durable: true,
            exclusive: false,
            autoDelete: true
          })
        )
      ).once();
      verify(mockedChannel.prefetch(1)).once();
    });

    it('should be disposed if connect timeout is passed', async () => {
      // arrange
      jest.useFakeTimers();
      jest
        .spyOn(global, 'setTimeout')
        .mockImplementation((callback: (args: void) => void) => {
          callback();

          return {} as unknown as NodeJS.Timeout;
        });
      when(spiedOptions.socketOptions).thenReturn({ connectTimeout: 1000 });

      // act
      await rmq.init();
      jest.runAllTimers();

      // assert
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
      verify(mockedConnectionManager.close()).once();
    });

    it('should reset connection timeout', async () => {
      // arrange
      jest.useFakeTimers();
      jest.spyOn(global, 'clearTimeout');

      when(mockedConnectionManager.once('connect', anyFunction())).thenCall(
        (_: string, callback: () => unknown) => callback()
      );
      when(spiedOptions.socketOptions).thenReturn({ connectTimeout: 1000 });

      // act
      await rmq.init();

      // assert
      expect(clearTimeout).toHaveBeenCalled();
      verify(mockedConnectionManager.close()).never();
    });

    it.todo('should bind DLXs');

    it.todo('should skip DLXs binding');
  });

  describe('destroy', () => {
    beforeEach(() => rmq.init());

    afterEach(() => resetCalls(mockedChannelWrapper));

    it('should remove channel and client', async () => {
      // arrange
      when(mockedConnectionManager.close()).thenResolve();
      when(mockedChannelWrapper.close()).thenResolve();

      // act
      await rmq.destroy();

      // assert
      verify(mockedConnectionManager.close()).once();
      verify(mockedChannelWrapper.close()).once();
      expect(rmq).not.toMatchObject({
        channel: expect.anything(),
        client: expect.anything()
      });
    });
  });

  describe('publish', () => {
    it('should throw an error if client is not initialized yet', async () => {
      // arrange
      const message = new ConcreteEvent({ foo: 'bar' });

      // act
      const result = rmq.publish(message);

      // assert
      await expect(result).rejects.toThrow(
        'established a connection with host'
      );
    });

    it('should publish an message', async () => {
      // arrange
      const message = new ConcreteEvent({ foo: 'bar' });

      when(
        mockedChannelWrapper.publish(
          anyString(),
          anyString(),
          anything(),
          anything()
        )
      ).thenReturn();

      await rmq.init();

      // act
      await rmq.publish(message);

      // assert
      verify(
        mockedChannelWrapper.publish(
          options.exchange,
          message.type,
          anyOfClass(Buffer),
          objectContaining({
            type: message.type,
            mandatory: true,
            persistent: true,
            contentType: 'application/json',
            timestamp: message.createdAt.getTime(),
            correlationId: message.correlationId
          })
        )
      ).once();
    });
  });

  describe('subscribe', () => {
    beforeEach(async () => {
      await rmq.init();

      resetCalls(mockedChannelWrapper);
    });

    it('should throw an error if no such handler', async () => {
      // arrange
      when(mockedDependencyContainer.isRegistered(anything())).thenReturn(
        false
      );

      // act / assert
      await expect(rmq.register(ConcreteFirstHandler)).rejects.toThrow(
        'Event handler not found'
      );
      verify(mockedChannelWrapper.addSetup(anyFunction())).never();
    });

    it('should throw an error if no subscriptions', async () => {
      // arrange
      when(mockedDependencyContainer.isRegistered(anything())).thenReturn(true);
      when(
        mockedDependencyContainer.resolve<ConcreteThirdHandler>(anything())
      ).thenReturn(new ConcreteThirdHandler());

      // act / assert
      await expect(rmq.register(ConcreteThirdHandler)).rejects.toThrow(
        'No subscriptions found'
      );
      verify(mockedChannelWrapper.addSetup(anyFunction())).never();
    });

    it('should add handler for event', async () => {
      // arrange
      when(mockedDependencyContainer.isRegistered(anything())).thenReturn(true);
      when(
        mockedDependencyContainer.resolve<ConcreteFirstHandler>(anything())
      ).thenReturn(new ConcreteFirstHandler());

      // act
      await rmq.register(ConcreteFirstHandler);

      // assert
      verify(mockedChannelWrapper.addSetup(anyFunction())).once();
      verify(
        mockedChannel.bindQueue(
          options.clientQueue,
          options.exchange,
          ConcreteEvent.name
        )
      ).once();
    });

    it('should add multiple handlers for the same event', async () => {
      // arrange
      when(mockedDependencyContainer.isRegistered(anything())).thenReturn(true);
      when(
        mockedDependencyContainer.resolve<ConcreteFirstHandler>(anything())
      ).thenReturn(new ConcreteFirstHandler());

      // act
      await rmq.register(ConcreteFirstHandler);
      await rmq.register(ConcreteSecondHandler);

      // assert
      verify(mockedChannelWrapper.addSetup(anyFunction())).once();
      verify(
        mockedChannel.bindQueue(
          options.clientQueue,
          options.exchange,
          ConcreteEvent.name
        )
      ).once();
    });
  });

  describe('processMessage', () => {
    const handler = new ConcreteFirstHandler();
    let spiedHandler!: ConcreteFirstHandler;
    let processMessage!: (msg: ConsumeMessage | null) => Promise<unknown>;

    beforeEach(async () => {
      when(mockedDependencyContainer.isRegistered(anything())).thenReturn(true);
      when(
        mockedDependencyContainer.resolve<ConcreteFirstHandler>(anything())
      ).thenReturn(handler);
      when(
        mockedChannel.consume(options.clientQueue, anyFunction(), anything())
      ).thenCall(
        (
          _: string,
          callback: (msg: ConsumeMessage | null) => Promise<unknown>
        ) => (processMessage = callback)
      );
      spiedHandler = spy(handler);

      await rmq.init();
      await rmq.register(ConcreteFirstHandler);
    });

    afterEach(() => reset(spiedHandler));

    it('should handle a consumed event', async () => {
      // arrange
      const payload = { foo: 'bar' };
      const message = {
        content: Buffer.from(JSON.stringify(payload)),
        fields: {
          redelivered: false,
          routingKey: ConcreteEvent.name
        },
        properties: {
          type: ConcreteEvent.name,
          correlationId: '1'
        }
      } as ConsumeMessage;

      // act
      await processMessage(message);

      // assert
      verify(spiedHandler.handle(deepEqual(payload))).once();
    });

    it('should send a reply', async () => {
      // arrange
      const payload = { foo: 'bar' };
      const reply = { bar: 'foo' };
      const replyTo = 'reply-queue';
      const message = {
        content: Buffer.from(JSON.stringify(payload)),
        fields: {
          redelivered: false,
          routingKey: ConcreteEvent.name
        },
        properties: {
          replyTo,
          correlationId: '1',
          type: ConcreteEvent.name
        }
      } as ConsumeMessage;
      when(spiedHandler.handle(anything())).thenResolve(reply);

      // act
      await processMessage(message);

      // assert
      verify(spiedHandler.handle(deepEqual(payload))).once();
      verify(
        mockedChannelWrapper.publish(
          '',
          replyTo,
          anyOfClass(Buffer),
          anything()
        )
      ).once();
    });

    it('should throw an error if no active subscriptions', async () => {
      // arrange
      const payload = { foo: 'bar' };
      const message = {
        content: Buffer.from(JSON.stringify(payload)),
        fields: {
          redelivered: false,
          routingKey: 'test'
        },
        properties: {
          type: 'test',
          correlationId: '1'
        }
      } as ConsumeMessage;

      // act / assert
      verify(spiedHandler.handle(anything())).never();
      await expect(processMessage(message)).rejects.toThrow(
        'Event handler not found'
      );
    });

    it('should skip a redelivered event', async () => {
      // arrange
      const payload = { foo: 'bar' };
      const message = {
        content: Buffer.from(JSON.stringify(payload)),
        fields: {
          redelivered: true,
          routingKey: ConcreteEvent.name
        },
        properties: {
          type: ConcreteEvent.name,
          correlationId: '1'
        }
      } as ConsumeMessage;

      // act
      await processMessage(message);

      // assert
      verify(spiedHandler.handle(anything())).never();
    });
  });

  describe('unsubscribe', () => {
    beforeEach(async () => {
      await rmq.init();

      resetCalls(mockedChannelWrapper);
    });

    it('should remove handler for event', async () => {
      // arrange
      when(mockedChannelWrapper.removeSetup(anyFunction())).thenCall(
        (callback: (...args: unknown[]) => unknown) =>
          callback(instance(mockedChannel))
      );
      when(
        mockedChannel.unbindQueue(anyString(), anyString(), anyString())
      ).thenResolve();
      when(mockedDependencyContainer.isRegistered(anything())).thenReturn(true);
      when(
        mockedDependencyContainer.resolve<ConcreteFirstHandler>(anything())
      ).thenReturn(new ConcreteFirstHandler());

      await rmq.register(ConcreteFirstHandler);

      // act
      await rmq.unregister(ConcreteFirstHandler);

      // assert
      verify(mockedChannelWrapper.removeSetup(anyFunction())).once();
      verify(
        mockedChannel.unbindQueue(
          options.clientQueue,
          options.exchange,
          ConcreteEvent.name
        )
      ).once();
    });

    it('should throw an error if no such handler', async () => {
      // arrange
      when(mockedDependencyContainer.isRegistered(anything())).thenReturn(
        false
      );

      // act / assert
      await expect(rmq.unregister(ConcreteFirstHandler)).rejects.toThrow(
        'Event handler not found'
      );
      verify(mockedChannelWrapper.removeSetup(anyFunction())).never();
    });

    it('should throw an error if no subscriptions', async () => {
      // arrange
      when(mockedDependencyContainer.isRegistered(anything())).thenReturn(true);
      when(
        mockedDependencyContainer.resolve<ConcreteThirdHandler>(anything())
      ).thenReturn(new ConcreteThirdHandler());

      // act / assert
      await expect(rmq.unregister(ConcreteThirdHandler)).rejects.toThrow(
        'No subscriptions found'
      );
      verify(mockedChannelWrapper.addSetup(anyFunction())).never();
    });

    it('should remove multiple handlers for the same event', async () => {
      // arrange
      when(mockedDependencyContainer.isRegistered(anything())).thenReturn(true);
      when(
        mockedDependencyContainer.resolve<ConcreteFirstHandler>(anything())
      ).thenReturn(new ConcreteFirstHandler());

      await rmq.register(ConcreteFirstHandler);
      await rmq.register(ConcreteSecondHandler);

      // act
      await rmq.unregister(ConcreteFirstHandler);

      // assert
      verify(mockedChannelWrapper.removeSetup(anyFunction())).never();
      verify(
        mockedChannel.unbindQueue(
          options.clientQueue,
          options.exchange,
          ConcreteEvent.name
        )
      ).never();
    });
  });
});
