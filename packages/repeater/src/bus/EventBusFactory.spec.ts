import 'reflect-metadata';
import { EventBusFactory } from './EventBusFactory';
import { Configuration, Credentials } from '@secbox/core';
import { instance, mock, reset, when } from 'ts-mockito';
import { RMQEventBus } from '@secbox/bus';
import { container } from 'tsyringe';

describe('EventBusFactory', () => {
  const token = 'dummmmy.nexa.vennegtzr2h7urpxgtksetz2kwppdgj0';
  const MockedConfiguration = mock<Configuration>(Configuration);

  let mockedConfiguration: Configuration;

  beforeEach(() => {
    mockedConfiguration = instance(MockedConfiguration);
  });

  afterEach(() => reset(MockedConfiguration));

  describe('create', () => {
    it('should throw an error on missing credentials', async () => {
      const factory = new EventBusFactory(mockedConfiguration);

      const res = factory.create('id');

      await expect(res).rejects.toThrow(
        'Please provide credentials to establish a connection with the bus.'
      );
    });

    it('should create event bus', async () => {
      when(MockedConfiguration.loadCredentials()).thenResolve();
      when(MockedConfiguration.credentials).thenReturn(
        new Credentials({ token })
      );
      when(MockedConfiguration.container).thenReturn(container);
      const factory = new EventBusFactory(mockedConfiguration);

      const res = factory.create('id');

      await expect(res).resolves.toBeInstanceOf(RMQEventBus);
    });
  });
});
