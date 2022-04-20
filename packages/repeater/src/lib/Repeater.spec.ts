import 'reflect-metadata';
import { Repeater, RunningStatus } from './Repeater';
import { RegisterRepeaterCommand, RepeaterStatusEvent } from '../bus';
import { Configuration, EventBus } from '@secbox/core';
import {
  anyOfClass,
  instance,
  mock,
  objectContaining,
  reset,
  verify,
  when
} from 'ts-mockito';

describe('Repeater', () => {
  const version = '42.0.1';
  const repeaterId = 'fooId';

  let repeater!: Repeater;
  const mockedConfiguration = mock<Configuration>();
  const mockedEventBus = mock<EventBus>();

  beforeEach(() => {
    repeater = new Repeater({
      repeaterId,
      bus: instance(mockedEventBus),
      configuration: instance(mockedConfiguration)
    });

    when(mockedConfiguration.version).thenReturn(version);
    when(
      mockedEventBus.execute(anyOfClass(RegisterRepeaterCommand))
    ).thenResolve({ version });
    when(mockedEventBus.publish(anyOfClass(RepeaterStatusEvent))).thenResolve();

    jest.useFakeTimers();
  });

  afterEach(() => {
    reset<Configuration | EventBus>(mockedConfiguration, mockedEventBus);

    jest.useRealTimers();
  });

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
      when(MockedEventBus.execute(anyOfClass(RegisterRepeaterCommand)))
        .thenReject()
        .thenResolve();

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
});
