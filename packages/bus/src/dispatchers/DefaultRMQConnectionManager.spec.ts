import 'reflect-metadata';
import { DefaultRMQConnectionManager } from './DefaultRMQConnectionManager';
import { RMQConnectionConfig } from './RMQConnectionConfig';
import { Logger } from '@sectester/core';
import {
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

describe('DefaultRMQConnectionManager', () => {
  const mockedConnectionManagerConstructor = jest.fn();
  const mockedAmqpConnectionManager = mock<AmqpConnectionManager>();
  const mockedChannelWrapper = mock<ChannelWrapper>();
  const mockedLogger = mock<Logger>();
  const options: RMQConnectionConfig = {
    url: 'amqp://localhost:5672'
  };
  const spiedOptions = spy(options);

  let sut!: DefaultRMQConnectionManager;

  beforeEach(() => {
    jest.mock('amqp-connection-manager', () => ({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      AmqpConnectionManagerClass:
        mockedConnectionManagerConstructor.mockImplementation(() =>
          instance(mockedAmqpConnectionManager)
        )
    }));
    when(mockedAmqpConnectionManager.createChannel(anything())).thenReturn(
      instance(mockedChannelWrapper)
    );

    sut = new DefaultRMQConnectionManager(instance(mockedLogger), options);
  });

  afterEach(() => {
    reset<
      ChannelWrapper | AmqpConnectionManager | RMQConnectionConfig | Logger
    >(
      mockedAmqpConnectionManager,
      mockedChannelWrapper,
      spiedOptions,
      mockedLogger
    );
    jest.resetModules();
    jest.resetAllMocks();
  });

  describe('connect', () => {
    afterEach(() => jest.useRealTimers());

    it('should skip initialization if client is already initialized', async () => {
      // arrange
      await sut.connect();

      // act
      await sut.connect();

      // assert
      verify(mockedAmqpConnectionManager.connect(anything())).once();
    });

    it('should set credentials', async () => {
      // arrange
      when(spiedOptions.credentials).thenReturn({
        username: 'user',
        password: 'pa$$word'
      });

      // act
      await sut.connect();

      // assert
      expect(mockedConnectionManagerConstructor).toHaveBeenCalledWith(
        'amqp://localhost:5672',
        expect.objectContaining({
          connectionOptions: {
            credentials: {
              mechanism: 'PLAIN',
              username: 'user',
              password: 'pa$$word',
              response: expect.any(Function)
            }
          }
        })
      );
    });

    it('should set max frame as URL query param', async () => {
      // arrange
      when(spiedOptions.frameMax).thenReturn(1);

      // act
      await sut.connect();

      // assert
      expect(mockedConnectionManagerConstructor).toHaveBeenCalledWith(
        'amqp://localhost:5672?frameMax=1',
        expect.anything()
      );
    });

    it('should be disposed if connect timeout is passed', async () => {
      // arrange
      when(spiedOptions.connectTimeout).thenReturn(10);

      // act
      await sut.connect();

      // assert
      verify(
        mockedAmqpConnectionManager.connect(
          objectContaining({ timeout: 10000 })
        )
      ).once();
    });
  });

  describe('destroy', () => {
    beforeEach(() => sut.connect());

    afterEach(() => resetCalls(mockedChannelWrapper));

    it('should remove client', async () => {
      // act
      await sut.disconnect();

      // assert
      verify(mockedAmqpConnectionManager.close()).once();
      expect(sut).not.toMatchObject({
        channel: expect.anything(),
        client: expect.anything()
      });
    });
  });

  describe('createChannel', () => {
    it('should create a channel', async () => {
      // arrange
      await sut.connect();
      when(mockedAmqpConnectionManager.isConnected()).thenReturn(true);

      // act
      const result = sut.createChannel();

      // assert
      verify(
        mockedAmqpConnectionManager.createChannel(deepEqual({ json: false }))
      ).once();
      expect(result).not.toBeNull();
      expect(result).not.toBeUndefined();
    });

    it('should throw an error when connection is lost', () => {
      // act
      const act = () => sut.createChannel();

      // assert
      verify(
        mockedAmqpConnectionManager.createChannel(deepEqual({ json: true }))
      ).never();
      expect(act).toThrow();
    });
  });
});
