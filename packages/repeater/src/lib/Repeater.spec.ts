import 'reflect-metadata';
import { Repeater, RunningStatus } from './Repeater';
import { RegisterRepeaterCommand, RepeaterStatusEvent } from '../bus';
import { Configuration, EventBus, Logger } from '@secbox/core';
import {
  anyOfClass,
  instance,
  mock,
  objectContaining,
  reset,
  spy,
  verify,
  when
} from 'ts-mockito';
import { container, DependencyContainer } from 'tsyringe';

describe('Repeater', () => {
  const version = '42.0.1';
  const repeaterId = 'fooId';

  let repeater!: Repeater;
  const mockedConfiguration = mock<Configuration>();
  const mockedEventBus = mock<EventBus>();
  const mockedLogger = mock<Logger>();
  const spiedContainer = spy(container);

  const createRepeater = () =>
    new Repeater({
      repeaterId,
      bus: instance(mockedEventBus),
      configuration: instance(mockedConfiguration)
    });

  beforeEach(() => {
    when(spiedContainer.resolve(Logger)).thenReturn(instance(mockedLogger));
    when(mockedConfiguration.version).thenReturn(version);
    when(mockedConfiguration.container).thenReturn(container);
    when(
      mockedEventBus.execute(anyOfClass(RegisterRepeaterCommand))
    ).thenResolve({ payload: { version } });
    when(mockedEventBus.publish(anyOfClass(RepeaterStatusEvent))).thenResolve();

    jest.useFakeTimers();

    repeater = createRepeater();
  });

  afterEach(() => {
    reset<Configuration | EventBus | DependencyContainer | Logger>(
      mockedConfiguration,
      mockedEventBus,
      mockedLogger,
      spiedContainer
    );

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

    it('should stop() on process termination', async () => {
      repeater = createRepeater();
      const spiedRepeater = spy(repeater);

      await repeater.start();
      process.emit('SIGTERM' as any);

      verify(spiedRepeater.stop()).once();
      expect(repeater.runningStatus).toBe(RunningStatus.OFF);
    });

    it('should not stop() repeater which is not running', () => {
      repeater = createRepeater();
      const spiedRepeater = spy(repeater);

      process.emit('SIGTERM' as any);

      verify(spiedRepeater.stop()).never();
    });
  });

  describe('runningStatus', () => {
    it('should have RunningStatus.OFF initially', () => {
      expect(repeater.runningStatus).toBe(RunningStatus.OFF);
    });
  });
});
