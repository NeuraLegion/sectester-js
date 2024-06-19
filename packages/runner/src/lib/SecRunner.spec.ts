import { SecRunner } from './SecRunner';
import { SecScan } from './SecScan';
import { Configuration, Logger } from '@sectester/core';
import { TestType } from '@sectester/scan';
import {
  anyString,
  anything,
  instance,
  mock,
  reset,
  spy,
  verify,
  when
} from 'ts-mockito';
import { DependencyContainer } from 'tsyringe';
import { Repeater, RepeaterFactory } from '@sectester/repeater';

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
  let terminationCallback!: () => Promise<unknown>;

  const repeaterId = 'fooId';

  const mockedContainer = mock<DependencyContainer>();
  const mockedConfiguration = mock<Configuration>();
  const mockedRepeaterFactory = mock<RepeaterFactory>();
  const mockedRepeater = mock<Repeater>();
  const mockedLogger = mock<Logger>();

  const container = instance(mockedContainer);

  const spiedProcess = spy(process);
  const maxListeners = process.getMaxListeners();

  beforeAll(() => process.setMaxListeners(100));
  afterAll(() => process.setMaxListeners(maxListeners));

  beforeEach(() => {
    when(mockedContainer.resolve<Logger>(Logger)).thenReturn(
      instance(mockedLogger)
    );
    when(mockedContainer.resolve<RepeaterFactory>(RepeaterFactory)).thenReturn(
      instance(mockedRepeaterFactory)
    );

    when(mockedContainer.createChildContainer()).thenReturn(container);

    when(mockedConfiguration.container).thenReturn(container);

    when(mockedConfiguration.loadCredentials()).thenResolve();

    when(mockedRepeater.repeaterId).thenReturn(repeaterId);

    when(mockedRepeaterFactory.createRepeater()).thenResolve(
      resolvableInstance(mockedRepeater)
    );
    when(spiedProcess.once('SIGTERM', anything())).thenCall((_, callback) => {
      terminationCallback = callback;
    });

    jest.useFakeTimers();

    const config = instance(mockedConfiguration);
    Object.setPrototypeOf(config, Configuration.prototype);
    secRunner = new SecRunner(config);
  });

  afterEach(() => {
    jest.useRealTimers();
    reset<
      | DependencyContainer
      | Configuration
      | RepeaterFactory
      | Repeater
      | Logger
      | NodeJS.Process
    >(
      mockedContainer,
      mockedConfiguration,
      mockedRepeaterFactory,
      mockedRepeater,
      mockedLogger,
      spiedProcess
    );
  });

  describe('init', () => {
    beforeEach(() => secRunner.init());
    afterEach(() => secRunner.clear());

    it('should stop() on process termination', async () => {
      process.emit('SIGTERM', 'SIGTERM');
      await terminationCallback();

      verify(mockedRepeater.stop()).once();
    });

    it('should log an error on failed stop() on process termination', async () => {
      when(mockedRepeater.stop()).thenReject();

      process.emit('SIGTERM', 'SIGTERM');
      await terminationCallback();
      jest.useRealTimers();
      await new Promise(process.nextTick);

      verify(mockedLogger.error(anyString())).once();
    });

    it('should create repeater', () =>
      expect(secRunner.repeaterId).toBeDefined());

    it('should throw an error if called twice', async () => {
      const act = secRunner.init();
      await expect(act).rejects.toThrow('Already initialized');
    });

    it('should not throw an error on re-init after clearing', async () => {
      await secRunner.clear();

      await expect(secRunner.init()).resolves.not.toThrowError();
    });
  });

  describe('clear', () => {
    it('should remove handlers from the signals', async () => {
      await secRunner.init();
      await secRunner.clear();

      expect(process.listenerCount('SIGTERM')).toBe(0);
    });

    it('should remove repeater', async () => {
      await secRunner.init();
      await secRunner.clear();

      verify(mockedRepeater.stop()).once();
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
