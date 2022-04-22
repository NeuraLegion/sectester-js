import 'reflect-metadata';
import { Repeater, RunningStatus } from './Repeater';
import { RegisterRepeaterCommand, RepeaterStatusEvent } from '../bus';
import { Configuration, EventBus, Logger, LogLevel } from '@secbox/core';
import {
  anyOfClass,
  between,
  instance,
  mock,
  objectContaining,
  reset,
  spy,
  verify,
  when
} from 'ts-mockito';
import { container } from 'tsyringe';

describe('Repeater', () => {
  const version = '42.0.1';
  const repeaterId = 'fooId';

  let repeater!: Repeater;
  const mockedConfiguration = mock<Configuration>();
  const mockedEventBus = mock<EventBus>();
  const spiedContainer = spy(container);

  const createRepeater = () =>
    new Repeater({
      repeaterId,
      bus: instance(mockedEventBus),
      configuration: instance(mockedConfiguration)
    });

  beforeEach(() => {
    when(spiedContainer.resolve(Logger)).thenReturn(
      new Logger(LogLevel.SILENT)
    );
    when(mockedConfiguration.version).thenReturn(version);
    when(mockedConfiguration.container).thenReturn(container);
    when(
      mockedEventBus.execute(anyOfClass(RegisterRepeaterCommand))
    ).thenResolve({ version });
    when(mockedEventBus.publish(anyOfClass(RepeaterStatusEvent))).thenResolve();

    jest.useFakeTimers();

    repeater = createRepeater();
  });

  afterEach(() => {
    reset<Configuration | EventBus>(mockedConfiguration, mockedEventBus);

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

    it('should throw Error on failed registration', async () => {
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
  });

  describe('runningStatus', () => {
    it('should have RunningStatus.OFF initially', () => {
      expect(repeater.runningStatus).toBe(RunningStatus.OFF);
    });

    it('should have RunningStatus.STARTING just after start() call', () => {
      void repeater.start();
      expect(repeater.runningStatus).toBe(RunningStatus.STARTING);
    });

    it('should have RunningStatus.RUNNING after successful start()', async () => {
      await repeater.start();
      expect(repeater.runningStatus).toBe(RunningStatus.RUNNING);
    });

    it('should have RunningStatus.OFF after start() and stop()', async () => {
      await repeater.start();
      await repeater.stop();
      expect(repeater.runningStatus).toBe(RunningStatus.OFF);
    });

    it('should throw an error on start() twice', async () => {
      await repeater.start();

      const res = repeater.start();

      await expect(res).rejects.toThrow('Repeater is already active.');
    });

    it('should be possible to start() after start() error', async () => {
      when(mockedEventBus.execute(anyOfClass(RegisterRepeaterCommand)))
        .thenReject()
        .thenResolve({ version });

      await expect(repeater.start()).rejects.toThrow();
      await expect(repeater.start()).resolves.not.toThrow();
    });

    it('should throw an error on stop() without start()', async () => {
      const res = repeater.stop();

      await expect(res).rejects.toThrow('Cannot stop non-running repeater.');
    });

    it('should throw an error on stop() twice', async () => {
      await repeater.start();
      await repeater.stop();

      const res = repeater.stop();

      await expect(res).rejects.toThrow('Cannot stop non-running repeater.');
    });
  });

  describe('process termination', () => {
    let exitCodePromise: Promise<number>;

    const spiedProcess = spy(process);

    beforeEach(() => {
      exitCodePromise = new Promise(resolve => {
        when(spiedProcess.exit(between(0, 1))).thenCall(resolve);
      });
    });

    it('should stop()', async () => {
      repeater = createRepeater();

      await repeater.start();
      process.emit('SIGTERM' as any);

      expect(repeater.runningStatus).toBe(RunningStatus.OFF);
      await expect(exitCodePromise).resolves.toBe(0);
    });

    it('should return error code on stop() error', async () => {
      repeater = createRepeater();

      await repeater.start();

      when(
        mockedEventBus.publish(anyOfClass(RepeaterStatusEvent))
      ).thenReject();

      process.emit('SIGTERM' as any);

      expect(repeater.runningStatus).toBe(RunningStatus.OFF);
      await expect(exitCodePromise).resolves.toBe(1);
    });

    it('should not stop() repeater which is not running', () => {
      repeater = createRepeater();
      const spiedRepeater = spy(repeater);

      process.emit('SIGTERM' as any);

      verify(spiedRepeater.stop()).never();
    });
  });
});
