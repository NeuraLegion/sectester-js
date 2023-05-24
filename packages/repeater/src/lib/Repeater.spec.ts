import 'reflect-metadata';
import { Repeater, RunningStatus } from './Repeater';
import {
  RegisterRepeaterCommand,
  RepeaterRegisteringError,
  RepeaterStatusEvent
} from '../bus';
import { Configuration, EventBus, Logger } from '@sectester/core';
import {
  anyOfClass,
  anyString,
  anything,
  capture,
  instance,
  mock,
  objectContaining,
  reset,
  spy,
  verify,
  when
} from 'ts-mockito';
import { DependencyContainer } from 'tsyringe';

describe('Repeater', () => {
  const version = '42.0.1';
  const repeaterId = 'fooId';

  let repeater!: Repeater;
  const mockedConfiguration = mock<Configuration>();
  const mockedEventBus = mock<EventBus>();
  const mockedLogger = mock<Logger>();
  const mockedContainer = mock<DependencyContainer>();

  const createRepater = () =>
    new Repeater({
      repeaterId,
      bus: instance(mockedEventBus),
      configuration: instance(mockedConfiguration)
    });

  beforeEach(() => {
    when(mockedContainer.resolve(Logger)).thenReturn(instance(mockedLogger));
    when(mockedContainer.isRegistered(Logger, anything())).thenReturn(true);
    when(mockedConfiguration.repeaterVersion).thenReturn(version);
    when(mockedConfiguration.container).thenReturn(instance(mockedContainer));
    when(
      mockedEventBus.execute(anyOfClass(RegisterRepeaterCommand))
    ).thenResolve({ payload: { version } });
    when(mockedEventBus.publish(anyOfClass(RepeaterStatusEvent))).thenResolve();

    jest.useFakeTimers();

    repeater = createRepater();
  });

  afterEach(() => {
    reset<
      Configuration | EventBus | DependencyContainer | Logger | NodeJS.Process
    >(mockedConfiguration, mockedEventBus, mockedLogger, mockedContainer);

    jest.useRealTimers();
  });

  const maxListeners = process.getMaxListeners();
  beforeAll(() => process.setMaxListeners(100));
  afterAll(() => process.setMaxListeners(maxListeners));

  describe('start', () => {
    it('should start', async () => {
      await repeater.start();

      verify(
        mockedEventBus.execute(
          objectContaining({
            type: 'RepeaterRegistering',
            payload: {
              repeaterId,
              version
            }
          })
        )
      ).once();

      verify(
        mockedEventBus.publish(
          objectContaining({
            type: 'RepeaterStatusUpdated',
            payload: {
              repeaterId,
              status: 'connected'
            }
          })
        )
      ).once();
    });

    it('should throw an error on failed registration', async () => {
      when(
        mockedEventBus.execute(anyOfClass(RegisterRepeaterCommand))
      ).thenResolve();

      await expect(repeater.start()).rejects.toThrow(
        'Error registering repeater.'
      );
    });

    it('should send ping periodically', async () => {
      await repeater.start();
      jest.advanceTimersByTime(15000);
      jest.runOnlyPendingTimers();

      verify(
        mockedEventBus.publish(
          objectContaining({
            type: 'RepeaterStatusUpdated',
            payload: {
              repeaterId,
              status: 'connected'
            }
          })
        )
      ).thrice();
    });

    it('should have RunningStatus.STARTING just after start() call', () => {
      void repeater.start();
      expect(repeater.runningStatus).toBe(RunningStatus.STARTING);
    });

    it('should have RunningStatus.RUNNING after successful start()', async () => {
      await repeater.start();
      expect(repeater.runningStatus).toBe(RunningStatus.RUNNING);
    });

    it('should throw an error on start() twice', async () => {
      await repeater.start();

      const res = repeater.start();

      await expect(res).rejects.toThrow('Repeater is already active.');
    });

    it('should be possible to start() after start() error', async () => {
      when(mockedEventBus.execute(anyOfClass(RegisterRepeaterCommand)))
        .thenReject()
        .thenResolve({ payload: { version } });

      await expect(repeater.start()).rejects.toThrow();
      await expect(repeater.start()).resolves.not.toThrow();
    });

    it.each([
      {
        error: RepeaterRegisteringError.REQUIRES_TO_BE_UPDATED,
        expected: 'The current running version is no longer supported'
      },
      {
        error: RepeaterRegisteringError.BUSY,
        expected: `There is an already running Repeater with ID ${repeaterId}`
      },
      {
        error: RepeaterRegisteringError.NOT_FOUND,
        expected: 'Unauthorized access'
      },
      {
        error: RepeaterRegisteringError.NOT_ACTIVE,
        expected: 'The current Repeater is not active'
      }
    ])(
      'should throw an error on registration error ${error}',
      async ({ expected, error }) => {
        when(
          mockedEventBus.execute(anyOfClass(RegisterRepeaterCommand))
        ).thenResolve({
          payload: { error }
        });

        await expect(repeater.start()).rejects.toThrow(expected);
      }
    );

    it('should log a warning if a new version is available', async () => {
      const newVersion = version.replace(/(\d+)/, (_, x) => `${+x + 1}`);
      when(
        mockedEventBus.execute(anyOfClass(RegisterRepeaterCommand))
      ).thenResolve({
        payload: { version: newVersion }
      });

      await repeater.start();

      const [arg]: string[] = capture(mockedLogger.warn).first();
      expect(arg).toContain('A new Repeater version (%s) is available');
    });
  });

  describe('stop', () => {
    it('should stop', async () => {
      await repeater.start();
      await repeater.stop();

      verify(
        mockedEventBus.publish(
          objectContaining({
            type: 'RepeaterStatusUpdated',
            payload: {
              repeaterId,
              status: 'disconnected'
            }
          })
        )
      ).once();

      jest.advanceTimersByTime(25000);
      jest.runOnlyPendingTimers();

      verify(
        mockedEventBus.publish(
          objectContaining({ payload: { status: 'connected' } })
        )
      ).once();
    });

    it('should have RunningStatus.OFF after start() and stop()', async () => {
      await repeater.start();
      await repeater.stop();
      expect(repeater.runningStatus).toBe(RunningStatus.OFF);
    });

    it('should do nothing on stop() without start()', async () => {
      await repeater.stop();
      expect(repeater.runningStatus).toBe(RunningStatus.OFF);
    });

    it('should do nothing on second stop() call', async () => {
      await repeater.start();
      await repeater.stop();
      await repeater.stop();

      expect(repeater.runningStatus).toBe(RunningStatus.OFF);
    });

    describe('should handle process termination', () => {
      const spiedProcess = spy(process);

      let terminationCallback!: () => Promise<unknown>;

      beforeEach(() => {
        when(spiedProcess.once('SIGTERM', anything())).thenCall(
          (_, callback) => {
            terminationCallback = callback;
          }
        );
        repeater = createRepater();
      });

      afterEach(() => reset(spiedProcess));

      it('should stop() on process termination', async () => {
        const spiedRepeater = spy(repeater);

        await repeater.start();
        process.emit('SIGTERM' as any);
        await terminationCallback();

        verify(spiedRepeater.stop()).once();
        expect(repeater.runningStatus).toBe(RunningStatus.OFF);
      });

      it('should log an error on failed stop() on process termination', async () => {
        await repeater.start();
        when(
          mockedEventBus.publish(anyOfClass(RepeaterStatusEvent))
        ).thenReject();

        process.emit('SIGTERM' as any);
        await terminationCallback();
        jest.useRealTimers();
        await new Promise(process.nextTick);

        verify(mockedLogger.error(anyString())).once();
      });
    });
  });

  describe('runningStatus', () => {
    it('should have RunningStatus.OFF initially', () => {
      expect(repeater.runningStatus).toBe(RunningStatus.OFF);
    });
  });
});
