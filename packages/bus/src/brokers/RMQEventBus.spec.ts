// eslint-disable-next-line max-classes-per-file
import { RMQEventBus } from './RMQEventBus';
import { ConnectionFactory } from '../factories';
import { RMQEventBusConfig } from './RMQEventBusConfig';
import {
  bind,
  Command,
  Configuration,
  Event,
  EventHandler
} from '@secbox/core';
import { injectable } from 'tsyringe';
import { ConfirmChannel, Connection } from 'amqplib';
import { anything, instance, mock, reset, verify, when } from 'ts-mockito';

// Temporary fix for https://github.com/NagRock/ts-mockito/issues/191
const resolvableInstance = <T extends object>(mockInstance: T): T =>
  new Proxy<T>(instance(mockInstance), {
    get(target, prop, receiver) {
      if (
        ['Symbol(Symbol.toPrimitive)', 'then', 'catch'].includes(
          prop.toString()
        )
      ) {
        return undefined;
      }

      return Reflect.get(target, prop, receiver);
    }
  });

const randomString = (length: number): string => {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

describe('RMQEventBus', () => {
  const sdkConfig = new Configuration({
    cluster: 'localhost',
    credentials: {
      token: 'weobbz5.nexa.vennegtzr2h7urpxgtksetz2kwppdgj0'
    }
  });
  const busConfig: RMQEventBusConfig = {
    url: 'amqp://localhost',
    exchange: 'EventBus',
    clientQueue: 'agent:nnCF9MfHpbvdJVtSbQfKa1',
    socketOptions: {
      connectTimeout: 10000,
      heartbeatInterval: 5000,
      reconnectTime: 5000
    }
  };

  const mockedConnectionFactory = mock<ConnectionFactory<Connection>>();
  const mockedConnection = mock<Connection>();
  const mockedConfirmChannel = mock<ConfirmChannel>();

  let eventBus!: RMQEventBus;

  beforeEach(() => {
    when(
      mockedConfirmChannel.consume(anything(), anything(), anything())
    ).thenResolve({ consumerTag: `agent:${randomString(22)}` } as any);

    when(
      mockedConfirmChannel.assertExchange(anything(), anything(), anything())
    ).thenResolve();

    when(
      mockedConfirmChannel.assertQueue(anything(), anything())
    ).thenResolve();

    const confirmChannel = resolvableInstance(mockedConfirmChannel);
    when(mockedConnection.createConfirmChannel()).thenResolve(
      confirmChannel as any
    );

    const connection = resolvableInstance(mockedConnection);
    when(mockedConnectionFactory.create(anything(), anything())).thenResolve(
      connection
    );

    eventBus = new RMQEventBus(
      sdkConfig,
      busConfig,
      instance(mockedConnectionFactory)
    );
  });

  afterEach(() =>
    reset<ConnectionFactory<Connection> | Connection | ConfirmChannel>(
      mockedConnectionFactory,
      mockedConnection,
      mockedConfirmChannel
    )
  );

  describe('init', () => {
    it('should init event bus', async () => {
      await expect(eventBus.init?.call(eventBus)).resolves.not.toThrow();
      verify(mockedConnectionFactory.create(anything(), anything())).once();
      verify(mockedConnection.createConfirmChannel()).once();
      verify(
        mockedConfirmChannel.consume(anything(), anything(), anything())
      ).twice();
      verify(
        mockedConfirmChannel.assertExchange(anything(), anything(), anything())
      ).once();
      verify(mockedConfirmChannel.assertQueue(anything(), anything())).once();
    });

    it('should throw if create failsed', async () => {
      when(mockedConnectionFactory.create(anything(), anything())).thenReject();
      await expect(eventBus.init?.call(eventBus)).rejects.toThrow();
      verify(mockedConnectionFactory.create(anything(), anything())).atLeast(1);
      verify(mockedConnection.createConfirmChannel()).never();
      verify(
        mockedConfirmChannel.consume(anything(), anything(), anything())
      ).never();
      verify(
        mockedConfirmChannel.assertExchange(anything(), anything(), anything())
      ).never();
      verify(mockedConfirmChannel.assertQueue(anything(), anything())).never();
    });
  });

  describe('register', () => {
    it('should register handler', async () => {
      when(
        mockedConfirmChannel.bindQueue(anything(), anything(), anything())
      ).thenResolve();

      sdkConfig.container.register(BondedTestHandler, {
        useClass: BondedTestHandler
      });

      await eventBus.init?.();

      await expect(eventBus.register(BondedTestHandler)).resolves.not.toThrow();
      verify(
        mockedConfirmChannel.bindQueue(anything(), anything(), anything())
      ).once();
    });

    it('should throw if bus not inited', async () => {
      when(
        mockedConfirmChannel.bindQueue(anything(), anything(), anything())
      ).thenResolve();

      sdkConfig.container.register(BondedTestHandler, {
        useClass: BondedTestHandler
      });

      await expect(eventBus.register(BondedTestHandler)).rejects.toThrow();
      verify(
        mockedConfirmChannel.bindQueue(anything(), anything(), anything())
      ).never();
    });

    it('should throw if failed bindQueue', async () => {
      when(
        mockedConfirmChannel.bindQueue(anything(), anything(), anything())
      ).thenReject();

      sdkConfig.container.register(BondedTestHandler, {
        useClass: BondedTestHandler
      });

      await eventBus.init?.();

      await expect(eventBus.register(BondedTestHandler)).rejects.toThrow();
      verify(
        mockedConfirmChannel.bindQueue(anything(), anything(), anything())
      ).once();
    });

    it('should throw if cant get bonded event name', async () => {
      when(
        mockedConfirmChannel.bindQueue(anything(), anything(), anything())
      ).thenResolve();
      sdkConfig.container.register(UnbondedTestHandler, {
        useClass: UnbondedTestHandler
      });
      await eventBus.init?.();

      await expect(eventBus.register(UnbondedTestHandler)).rejects.toThrow();
      verify(
        mockedConfirmChannel.bindQueue(anything(), anything(), anything())
      ).never();
    });

    it('should throw if handler is unregister', async () => {
      when(
        mockedConfirmChannel.bindQueue(anything(), anything(), anything())
      ).thenThrow();
      await eventBus.init?.();

      await expect(eventBus.register(BondedTestHandler)).rejects.toThrow();
      verify(
        mockedConfirmChannel.bindQueue(anything(), anything(), anything())
      ).never();
    });
  });

  describe('unregister', () => {
    beforeEach(() => {
      when(
        mockedConfirmChannel.bindQueue(anything(), anything(), anything())
      ).thenResolve();
    });

    it('should unregister the registered handler', async () => {
      when(
        mockedConfirmChannel.unbindQueue(anything(), anything(), anything())
      ).thenResolve();
      sdkConfig.container.register(BondedTestHandler, {
        useClass: BondedTestHandler
      });
      await eventBus.init?.();

      await eventBus.register(BondedTestHandler);

      await expect(
        eventBus.unregister(BondedTestHandler)
      ).resolves.not.toThrow();
      verify(
        mockedConfirmChannel.unbindQueue(anything(), anything(), anything())
      ).once();
    });

    it('should not throw if handler is not registered', async () => {
      when(
        mockedConfirmChannel.unbindQueue(anything(), anything(), anything())
      ).thenResolve();
      sdkConfig.container.register(BondedTestHandler, {
        useClass: BondedTestHandler
      });
      await eventBus.init?.();

      await expect(
        eventBus.unregister(BondedTestHandler)
      ).resolves.not.toThrow();
      verify(
        mockedConfirmChannel.unbindQueue(anything(), anything(), anything())
      ).never();
    });

    it('should throw if bus is not inited', async () => {
      when(
        mockedConfirmChannel.unbindQueue(anything(), anything(), anything())
      ).thenResolve();
      sdkConfig.container.register(BondedTestHandler, {
        useClass: BondedTestHandler
      });

      await expect(eventBus.unregister(BondedTestHandler)).rejects.toThrow();
      verify(
        mockedConfirmChannel.unbindQueue(anything(), anything(), anything())
      ).never();
    });

    it('should throw if handler is not registered', async () => {
      when(
        mockedConfirmChannel.unbindQueue(anything(), anything(), anything())
      ).thenResolve();

      await eventBus.init?.();

      await expect(eventBus.unregister(BondedTestHandler)).rejects.toThrow();
      verify(
        mockedConfirmChannel.unbindQueue(anything(), anything(), anything())
      ).never();
    });

    it('should throw if event not bonded to handler', async () => {
      when(
        mockedConfirmChannel.unbindQueue(anything(), anything(), anything())
      ).thenResolve();

      await eventBus.init?.();

      await expect(eventBus.unregister(UnbondedTestHandler)).rejects.toThrow();
      verify(
        mockedConfirmChannel.unbindQueue(anything(), anything(), anything())
      ).never();
    });
  });

  describe('execute', () => {
    it('should execute command', async () => {
      when(
        mockedConfirmChannel.sendToQueue(anything(), anything(), anything())
      ).thenReturn();

      const command = new TestCommand({
        method: 'GET',
        url: 'https://example.com'
      });

      await eventBus.init?.();

      await expect(eventBus.execute(command)).resolves.not.toThrow();
      verify(
        mockedConfirmChannel.sendToQueue(anything(), anything(), anything())
      ).once();
    });

    it('should throw if bus not inited', async () => {
      when(
        mockedConfirmChannel.sendToQueue(anything(), anything(), anything())
      ).thenReturn();

      const command = new TestCommand({
        method: 'GET',
        url: 'https://example.com'
      });

      await expect(eventBus.execute(command)).rejects.toThrow();
      verify(
        mockedConfirmChannel.sendToQueue(anything(), anything(), anything())
      ).never();
    });

    it('should not throw if sendToQueue failed', async () => {
      when(
        mockedConfirmChannel.sendToQueue(anything(), anything(), anything())
      ).thenThrow();

      const command = new TestCommand({
        method: 'GET',
        url: 'https://example.com'
      });

      await eventBus.init?.();

      await expect(eventBus.execute(command)).resolves.not.toThrow();
      verify(
        mockedConfirmChannel.sendToQueue(anything(), anything(), anything())
      ).once();
    });
  });

  describe('publish', () => {
    it('should publish event', async () => {
      when(
        mockedConfirmChannel.publish(
          anything(),
          anything(),
          anything(),
          anything()
        )
      ).thenReturn();

      await eventBus.init?.();
      const event = new TestEvent({
        method: 'GET',
        url: 'https://example.com'
      });

      await expect(eventBus.publish(event)).resolves.not.toThrow();
      verify(
        mockedConfirmChannel.publish(
          anything(),
          anything(),
          anything(),
          anything()
        )
      ).once();
    });

    it('should throw if bus in not inited', async () => {
      when(
        mockedConfirmChannel.publish(
          anything(),
          anything(),
          anything(),
          anything()
        )
      ).thenReturn();

      const event = new TestEvent({
        method: 'GET',
        url: 'https://example.com'
      });

      await expect(eventBus.publish(event)).rejects.toThrow();
      verify(
        mockedConfirmChannel.publish(
          anything(),
          anything(),
          anything(),
          anything()
        )
      ).never();
    });

    it('should throw if publish failed', async () => {
      when(
        mockedConfirmChannel.publish(
          anything(),
          anything(),
          anything(),
          anything()
        )
      ).thenThrow(new Error());

      const event = new TestEvent({
        method: 'GET',
        url: 'https://example.com'
      });

      await eventBus.init?.();

      await expect(eventBus.publish(event)).rejects.toThrow();
      verify(
        mockedConfirmChannel.publish(
          anything(),
          anything(),
          anything(),
          anything()
        )
      ).atLeast(1);
    });
  });

  describe('destroy', () => {
    it('should destroy event bus', async () => {
      when(mockedConfirmChannel.waitForConfirms()).thenResolve();
      when(mockedConfirmChannel.cancel(anything())).thenResolve();
      when(mockedConfirmChannel.close()).thenResolve();
      when(mockedConnection.close()).thenResolve();

      await eventBus.init?.();

      await expect(eventBus.destroy?.()).resolves.not.toThrow();
      verify(mockedConfirmChannel.waitForConfirms()).once();
      verify(mockedConfirmChannel.cancel(anything())).atLeast(2);
      verify(mockedConfirmChannel.close()).once();
      verify(mockedConnection.close()).once();
    });

    it('should throw if bus is not inited', async () => {
      await expect(eventBus.destroy?.()).rejects.toThrow();
    });

    it('should throw if waitForConfirms failed', async () => {
      when(mockedConfirmChannel.waitForConfirms()).thenReject();
      when(mockedConfirmChannel.cancel(anything())).thenResolve();
      when(mockedConfirmChannel.close()).thenResolve();
      when(mockedConnection.close()).thenResolve();

      await eventBus.init?.();

      await expect(eventBus.destroy?.()).rejects.toThrow();
      verify(mockedConfirmChannel.waitForConfirms()).once();
      verify(mockedConfirmChannel.cancel(anything())).never();
      verify(mockedConfirmChannel.close()).never();
      verify(mockedConnection.close()).never();
    });

    it('should throw if cancel failed', async () => {
      when(mockedConfirmChannel.waitForConfirms()).thenResolve();
      when(mockedConfirmChannel.cancel(anything())).thenReject();
      when(mockedConfirmChannel.close()).thenResolve();
      when(mockedConnection.close()).thenResolve();

      await eventBus.init?.();

      await expect(eventBus.destroy?.()).rejects.toThrow();
      verify(mockedConfirmChannel.waitForConfirms()).once();
      verify(mockedConfirmChannel.cancel(anything())).atLeast(1);
      verify(mockedConfirmChannel.close()).never();
      verify(mockedConnection.close()).never();
    });

    it('should throw if chanel close failed', async () => {
      when(mockedConfirmChannel.waitForConfirms()).thenResolve();
      when(mockedConfirmChannel.cancel(anything())).thenResolve();
      when(mockedConfirmChannel.close()).thenReject();
      when(mockedConnection.close()).thenResolve();

      await eventBus.init?.();

      await expect(eventBus.destroy?.()).rejects.toThrow();
      verify(mockedConfirmChannel.waitForConfirms()).once();
      verify(mockedConfirmChannel.cancel(anything())).atLeast(1);
      verify(mockedConfirmChannel.close()).once();
      verify(mockedConnection.close()).never();
    });

    it('should throw if connection close failed', async () => {
      when(mockedConfirmChannel.waitForConfirms()).thenResolve();
      when(mockedConfirmChannel.cancel(anything())).thenResolve();
      when(mockedConfirmChannel.close()).thenResolve();
      when(mockedConnection.close()).thenReject();

      await eventBus.init?.();

      await expect(eventBus.destroy?.()).rejects.toThrow();
      verify(mockedConfirmChannel.waitForConfirms()).once();
      verify(mockedConfirmChannel.cancel(anything())).atLeast(1);
      verify(mockedConfirmChannel.close()).once();
      verify(mockedConnection.close()).once();
    });
  });
});

interface Request {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
}

class TestCommand<R = unknown> extends Command<Request, R> {
  public readonly expectReply = false;

  constructor(public readonly payload: Request) {
    super(payload);
  }
}

class TestEvent extends Event<Request> {
  constructor(payload: Request) {
    super(payload);
  }
}

@injectable()
@bind(TestEvent)
class BondedTestHandler implements EventHandler<TestEvent> {
  public handle(argument: TestEvent): Promise<any> {
    return new Promise(resolve => resolve(argument.payload));
  }
}

@injectable()
class UnbondedTestHandler implements EventHandler<TestEvent> {
  public handle(argument: TestEvent): Promise<any> {
    return new Promise(resolve => resolve(argument.payload));
  }
}
