import 'reflect-metadata';
import { RepeaterEventBusFactory } from './RepeaterEventBusFactory';
import { Configuration, Credentials, RetryStrategy } from '@secbox/core';
import { instance, mock, reset, when } from 'ts-mockito';
import { RMQEventBus } from '@secbox/bus';
import { DependencyContainer } from 'tsyringe';

describe('RepeaterEventBusFactory', () => {
  const token = 'dummmmy.nexa.vennegtzr2h7urpxgtksetz2kwppdgj0';
  const mockedContainer = mock<DependencyContainer>();
  const mockedConfiguration = mock<Configuration>();
  const mockedRetryStrategy = mock<RetryStrategy>();

  let container!: DependencyContainer;
  let configuration!: Configuration;
  let retryStrategy!: RetryStrategy;

  beforeEach(() => {
    container = instance(mockedContainer);
    configuration = instance(mockedConfiguration);
    retryStrategy = instance(mockedRetryStrategy);

    when(mockedContainer.resolve(Configuration)).thenReturn(configuration);
  });

  afterEach(() =>
    reset<DependencyContainer | Configuration | RetryStrategy>(
      mockedConfiguration,
      mockedContainer,
      mockedRetryStrategy
    )
  );

  describe('create', () => {
    it('should throw an error on missing credentials', async () => {
      when(mockedConfiguration.credentials).thenReturn();

      const factory = new RepeaterEventBusFactory(
        container,
        configuration,
        retryStrategy
      );

      const res = factory.create('fooId');

      await expect(res).rejects.toThrow(
        'Please provide credentials to establish a connection with the bus.'
      );
    });

    it('should create event bus', async () => {
      when(mockedConfiguration.loadCredentials()).thenResolve();
      when(mockedConfiguration.credentials).thenReturn(
        new Credentials({ token })
      );
      const factory = new RepeaterEventBusFactory(
        container,
        configuration,
        retryStrategy
      );

      const res = factory.create('id');

      await expect(res).resolves.toBeInstanceOf(RMQEventBus);
    });
  });
});
