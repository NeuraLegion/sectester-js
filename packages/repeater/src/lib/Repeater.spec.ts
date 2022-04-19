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
  });

  afterEach(() =>
    reset<Configuration | EventBus>(MockedConfiguration, MockedEventBus)
  );

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
  });

  describe('stop', () => {
    it('should stop', async () => {
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
    });
  });
});
