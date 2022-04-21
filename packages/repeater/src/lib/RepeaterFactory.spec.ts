import 'reflect-metadata';
import { RepeaterFactory } from './RepeaterFactory';
import { Repeater } from './Repeater';
import { RepeatersManager } from '../api';
import { EventBusFactory } from '../bus';
import { Configuration, EventBus } from '@secbox/core';
import { anything, capture, instance, mock, reset, when } from 'ts-mockito';
import { DependencyContainer } from 'tsyringe';

describe('RepeaterFactory', () => {
  const repeaterId = 'fooId';

  const mockedContainer = mock<DependencyContainer>();
  const mockedConfiguration = mock<Configuration>();
  const mockedRepeaterManager = mock<RepeatersManager>();
  const mockedEventBusFactory = mock<EventBusFactory>();

  const configuration = instance(mockedConfiguration);

  const eventBus = {
    init: jest.fn()
  } as unknown as EventBus;

  beforeEach(() => {
    when(mockedContainer.resolve<EventBusFactory>(EventBusFactory)).thenReturn(
      instance(mockedEventBusFactory)
    );
    when(
      mockedContainer.resolve<RepeatersManager>(RepeatersManager)
    ).thenReturn(instance(mockedRepeaterManager));

    when(mockedEventBusFactory.create(anything())).thenResolve(eventBus);

    when(mockedRepeaterManager.createRepeater(anything())).thenResolve({
      repeaterId
    });

    when(mockedConfiguration.container).thenReturn(instance(mockedContainer));
  });

  afterEach(() => {
    reset<
      DependencyContainer | Configuration | RepeatersManager | EventBusFactory
    >(
      mockedContainer,
      mockedConfiguration,
      mockedRepeaterManager,
      mockedEventBusFactory
    );

    jest.resetAllMocks();
  });

  describe('createRepeater', () => {
    it('should create repeater', async () => {
      const factory = new RepeaterFactory(configuration);

      const res = await factory.createRepeater();

      expect(eventBus.init).toHaveBeenCalled();
      expect(res).toBeInstanceOf(Repeater);
      expect(res).toMatchObject({
        repeaterId
      });
    });

    it('should create repeater with given name prefix and description', async () => {
      const factory = new RepeaterFactory(configuration);

      const res = await factory.createRepeater({
        namePrefix: 'foo',
        description: 'description'
      });

      const [arg]: [
        {
          name: string;
          description?: string;
        }
      ] = capture<{
        name: string;
        description?: string;
      }>(mockedRepeaterManager.createRepeater).first();

      expect(arg?.name).toMatch(/^foo/);
      expect(arg?.description).toBe('description');
      expect(res).toBeInstanceOf(Repeater);
    });
  });
});
