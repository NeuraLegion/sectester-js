import { SecRunner } from './SecRunner';
import { SecScan } from './SecScan';
import { Configuration } from '@secbox/core';
import { TestType } from '@secbox/scan';
import { instance, mock, reset, verify, when } from 'ts-mockito';
import { DependencyContainer } from 'tsyringe';
import { Repeater, RepeaterFactory, RepeatersManager } from '@secbox/repeater';

// eslint-disable-next-line jest/no-export
export const resolvableInstance = <T extends object>(m: T): T =>
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

  const container = instance(mockedContainer);

  beforeEach(() => {
    when(
      mockedContainer.resolve<RepeatersManager>(RepeatersManager)
    ).thenReturn(instance(mockedRepeaterManager));

    when(mockedContainer.resolve<RepeaterFactory>(RepeaterFactory)).thenReturn(
      instance(mockedRepeaterFactory)
    );

    when(mockedContainer.createChildContainer()).thenReturn(container);

    when(mockedConfiguration.container).thenReturn(container);

    when(mockedConfiguration.loadCredentials()).thenResolve();

    when(mockedRepeater.repeaterId).thenReturn(repeaterId);
    when(mockedRepeater.start()).thenResolve();
    when(mockedRepeater.stop()).thenResolve();

    when(mockedRepeaterFactory.createRepeater()).thenResolve(
      resolvableInstance(mockedRepeater)
    );

    const config = instance(mockedConfiguration);
    Object.setPrototypeOf(config, Configuration.prototype);
    secRunner = new SecRunner(config);
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

    it('should throw an error if called twice', async () => {
      await secRunner.init();

      await expect(secRunner.init()).rejects.toThrow('Already initialized');
    });

    it('should not throw an error on re-init after clearing', async () => {
      await secRunner.init();
      await secRunner.clear();

      await expect(secRunner.init()).resolves.not.toThrowError();
    });
  });

  describe('clear', () => {
    it('should remove repeater', async () => {
      await secRunner.init();
      await secRunner.clear();

      verify(mockedRepeater.stop()).once();
      verify(mockedRepeaterManager.deleteRepeater(repeaterId)).once();
      expect(secRunner.repeaterId).toBeUndefined();
    });

    it('should do nothing if not initialized', async () => {
      await expect(secRunner.clear()).resolves.not.toThrowError();
    });

    it('should do nothing if called twice', async () => {
      await secRunner.init();
      await secRunner.clear();

      await expect(secRunner.clear()).resolves.not.toThrowError();
    });
  });

  describe('createScan', () => {
    const options = { tests: [TestType.XSS] };

    it('should create scan', async () => {
      await secRunner.init();

      expect(secRunner.createScan(options)).toBeInstanceOf(SecScan);
    });

    it('should throw an error if not initialized', () => {
      expect(() => secRunner.createScan(options)).toThrow(
        'Must be initialized first'
      );
    });
  });
});
