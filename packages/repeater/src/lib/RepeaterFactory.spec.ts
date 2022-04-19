import 'reflect-metadata';
import { RepeaterFactory } from './RepeaterFactory';
import { Repeater } from './Repeater';
import { RepeatersManager } from '../api';
import { EventBusFactory } from '../bus';
import { Configuration, EventBus } from '@secbox/core';
import { anything, instance, mock, reset, when } from 'ts-mockito';
import { DependencyContainer } from 'tsyringe';

describe('RepeaterFactory', () => {
  const repeaterId = 'fooId';

  const MockedContainer = mock<DependencyContainer>();
  const MockedConfiguration = mock<Configuration>();
  const MockedRepeaterManager = mock<RepeatersManager>();
  const MockedEventBusFactory = mock<EventBusFactory>();

  const mockedConfiguration = instance(MockedConfiguration);

  beforeEach(() => {
    when(MockedContainer.resolve<EventBusFactory>(EventBusFactory)).thenReturn(
      instance(MockedEventBusFactory)
    );
    when(
      MockedContainer.resolve<RepeatersManager>(RepeatersManager)
    ).thenReturn(instance(MockedRepeaterManager));

    when(MockedEventBusFactory.create(anything())).thenResolve(
      {} as unknown as EventBus
    );

    when(MockedRepeaterManager.createRepeater(anything())).thenResolve({
      repeaterId
    });

    when(MockedConfiguration.container).thenReturn(instance(MockedContainer));
  });

  afterEach(() =>
    reset<
      DependencyContainer | Configuration | RepeatersManager | EventBusFactory
    >(
      MockedContainer,
      MockedConfiguration,
      MockedRepeaterManager,
      MockedEventBusFactory
    )
  );

  describe('createRepeater', () => {
    it('should create repeater', async () => {
      const factory = new RepeaterFactory(mockedConfiguration);

      const res = await factory.createRepeater();

      expect(res).toBeInstanceOf(Repeater);
      expect(res).toMatchObject({
        repeaterId
      });
    });
  });
});
