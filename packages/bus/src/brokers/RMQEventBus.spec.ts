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
import { Channel } from 'amqplib';
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

class ConcreteEvent extends Event<string> {
  constructor(
    payload: string,
    type?: string,
    correlationId?: string,
    createdAt?: Date
  ) {
    super(payload, type, correlationId, createdAt);
  }
}

@bind(ConcreteEvent)
class ConcreteFirstHandler implements EventHandler<string> {
  public async handle(_: string): Promise<void> {
    // noop
  }
}

@bind(ConcreteEvent)
class ConcreteSecondHandler implements EventHandler<string> {
  public async handle(_: string): Promise<void> {
    // noop
  }
}

describe('RMQEventBus', () => {
  const amqpConnectionManager = mock<AmqpConnectionManager>();
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
      connect: jest.fn().mockReturnValue(instance(amqpConnectionManager))
    }));
    when(amqpConnectionManager.on('connect', anyFunction())).thenCall(
      (_: string, callback: (...args: unknown[]) => unknown) => callback()
    );
    when(amqpConnectionManager.createChannel(anything())).thenReturn(
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
      amqpConnectionManager,
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
      const command = new ConcreteCommand('test');
      when(
        mockedChannelWrapper.sendToQueue(
          anyString(),
          anyOfClass(Buffer),
          anything()
        )
      ).thenResolve();

      await rmq.init();

      process.nextTick(() => (rmq as any).subject.emit(command.correlationId));

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

      await rmq.init();

      const expected = { foo: 'bar' };
      process.nextTick(() =>
        (rmq as any).subject.emit(command.correlationId, expected)
      );

      // act
      const result = await rmq.execute(command);

      // assert
      expect(result).toEqual(expected);
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
    it('should skip initialization if client is already initialized', async () => {
      // arrange
      await rmq.init();

      // act
      await rmq.init();

      // assert
      verify(
        amqpConnectionManager.createChannel(
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
        amqpConnectionManager.createChannel(
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

    it.todo('should bind DLXs');

    it.todo('should skip DLXs binding');
  });

  describe('destroy', () => {
    beforeEach(() => rmq.init());

    afterEach(() => resetCalls(mockedChannelWrapper));

    it('should remove channel and client', async () => {
      // arrange
      when(amqpConnectionManager.close()).thenResolve();
      when(mockedChannelWrapper.close()).thenResolve();

      // act
      await rmq.destroy();

      // assert
      verify(amqpConnectionManager.close()).once();
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
      const message = new ConcreteEvent('test');

      // act
      const result = rmq.publish(message);

      // assert
      await expect(result).rejects.toThrow(
        'established a connection with host'
      );
    });

    it('should publish an message', async () => {
      // arrange
      const message = new ConcreteEvent('test');

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
