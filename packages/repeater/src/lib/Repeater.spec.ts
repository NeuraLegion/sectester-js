import 'reflect-metadata';
import { Repeater } from './Repeater';
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
  const MockedConfiguration = mock<Configuration>();
  const MockedEventBus = mock<EventBus>();

  beforeEach(() => {
    repeater = new Repeater({
      repeaterId,
      bus: instance(MockedEventBus),
      configuration: instance(MockedConfiguration)
    });

    when(MockedConfiguration.version).thenReturn(version);
    when(
      MockedEventBus.execute(anyOfClass(RegisterRepeaterCommand))
    ).thenResolve({ version });
    when(MockedEventBus.publish(anyOfClass(RepeaterStatusEvent))).thenResolve();

    jest.useFakeTimers();
  });

  afterEach(() => {
    reset<Configuration | EventBus>(MockedConfiguration, MockedEventBus);

    jest.useRealTimers();
  });

  describe('start', () => {
    it('should start', async () => {
      await repeater.start();

      verify(
        MockedEventBus.execute(
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
        MockedEventBus.publish(
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

    it('should send ping periodically', async () => {
      await repeater.start();
      jest.advanceTimersByTime(15000);
      jest.runOnlyPendingTimers();

      verify(
        MockedEventBus.publish(
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
        MockedEventBus.publish(
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
        MockedEventBus.publish(
          objectContaining({ payload: { status: 'connected' } })
        )
      ).once();
    });
  });
});
