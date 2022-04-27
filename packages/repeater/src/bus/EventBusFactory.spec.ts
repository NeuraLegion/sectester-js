import 'reflect-metadata';
import { EventBusFactory } from './EventBusFactory';
import { Configuration, Credentials } from '@secbox/core';
import { instance, mock, reset, when } from 'ts-mockito';
import { RMQEventBus } from '@secbox/bus';
import { container } from 'tsyringe';

describe('EventBusFactory', () => {
  const token = 'dummmmy.nexa.vennegtzr2h7urpxgtksetz2kwppdgj0';
  const mockedConfiguration = mock<Configuration>();

  let configuration!: Configuration;

  beforeEach(() => {
    configuration = instance(mockedConfiguration);
  });

  afterEach(() => reset(mockedConfiguration));

  describe('create', () => {
    it('should throw an error on missing credentials', async () => {
      when(mockedConfiguration.credentials).thenReturn();

      const factory = new EventBusFactory(configuration, container);

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
      const factory = new EventBusFactory(configuration, container);

      const res = factory.create('id');

      await expect(res).resolves.toBeInstanceOf(RMQEventBus);
    });
  });
});
