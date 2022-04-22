import 'reflect-metadata';
import { RepeaterFactory } from './RepeaterFactory';
import { Repeater } from './Repeater';
import { RepeatersManager } from '../api';
import { EventBusFactory } from '../bus';
import { Configuration, EventBus } from '@secbox/core';
import {
  anything,
  capture,
  instance,
  mock,
  reset,
  verify,
  when
} from 'ts-mockito';
import { DependencyContainer } from 'tsyringe';

const resolvableInstance = <T extends object>(m: T): T =>
  new Proxy<T>(instance(m), {
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

describe('RepeaterFactory', () => {
  const repeaterId = 'fooId';

  const mockedContainer = mock<DependencyContainer>();
  const mockedConfiguration = mock<Configuration>();
  const mockedEventBus = mock<EventBus>();
  const mockedEventBusFactory = mock<EventBusFactory>();
  const mockedRepeaterManager = mock<RepeatersManager>();

  const configuration = instance(mockedConfiguration);

  beforeEach(() => {
    when(mockedContainer.resolve<EventBusFactory>(EventBusFactory)).thenReturn(
      instance(mockedEventBusFactory)
    );
    when(
      mockedContainer.resolve<RepeatersManager>(RepeatersManager)
    ).thenReturn(instance(mockedRepeaterManager));

    when(mockedConfiguration.container).thenReturn(instance(mockedContainer));

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    when(mockedEventBus.init!()).thenResolve();

    when(mockedEventBusFactory.create(anything())).thenResolve(
      resolvableInstance(mockedEventBus)
    );

    when(mockedRepeaterManager.createRepeater(anything())).thenResolve({
      repeaterId
    });
  });

  afterEach(() => {
    reset<
      | DependencyContainer
      | Configuration
      | EventBus
      | EventBusFactory
      | RepeatersManager
    >(
      mockedContainer,
      mockedConfiguration,
      mockedEventBus,
      mockedEventBusFactory,
      mockedRepeaterManager
    );
  });

  describe('createRepeater', () => {
    it('should create repeater', async () => {
      const factory = new RepeaterFactory(configuration);

      const res = await factory.createRepeater();

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      verify(mockedEventBus.init!()).once();
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
