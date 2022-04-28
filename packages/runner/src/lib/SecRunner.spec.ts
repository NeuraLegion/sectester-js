import 'reflect-metadata';
import { SecRunner } from '@secbox/runner';
import { Configuration } from '@secbox/core';
import { instance, mock, reset, when } from 'ts-mockito';
import { DependencyContainer } from 'tsyringe';
import { Repeater, RepeaterFactory, RepeatersManager } from '@secbox/repeater';

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

describe('SecRunner', () => {
  let secRunner!: SecRunner;

  const repeaterId = 'fooId';

  const mockedContainer = mock<DependencyContainer>();
  const mockedConfiguration = mock<Configuration>();
  const mockedRepeaterFactory = mock<RepeaterFactory>();
  const mockedRepeaterManager = mock<RepeatersManager>();
  const mockedRepeater = mock<Repeater>();

  beforeEach(() => {
    when(
      mockedContainer.resolve<RepeatersManager>(RepeatersManager)
    ).thenReturn(instance(mockedRepeaterManager));

    when(mockedContainer.resolve<RepeaterFactory>(RepeaterFactory)).thenReturn(
      instance(mockedRepeaterFactory)
    );

    when(mockedConfiguration.container).thenReturn(instance(mockedContainer));

    when(mockedRepeater.repeaterId).thenReturn(repeaterId);
    when(mockedRepeater.start()).thenResolve();
    when(mockedRepeater.stop()).thenResolve();

    when(mockedRepeaterFactory.createRepeater()).thenResolve(
      resolvableInstance(mockedRepeater)
    );

    secRunner = new SecRunner(instance(mockedConfiguration));
  });

  afterEach(() => {
    reset<
      | DependencyContainer
      | Configuration
      | RepeaterFactory
      | RepeatersManager
      | Repeater
    >(
      mockedContainer,
      mockedConfiguration,
      mockedRepeaterFactory,
      mockedRepeaterManager,
      mockedRepeater
    );
  });

  describe('init', () => {
    it('should create repeater', async () => {
      await secRunner.init();

      expect(secRunner.repeaterId).toBeDefined();
    });

    it('should throw an error on initializing more than once', async () => {
      await secRunner.init();

      await expect(secRunner.init()).rejects.toThrow('Already initialized');
    });
  });

  describe('clear', () => {
    it('should remove repeater', async () => {
      await secRunner.init();
      await secRunner.clear();

      expect(secRunner.repeaterId).toBeUndefined();
    });
  });
});
