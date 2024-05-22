import { DefaultRepeaterBus } from './DefaultRepeaterBus';
import { Protocol } from '../models/Protocol';
import { Request, Response } from '../request-runner';
import { RepeaterServer } from './RepeaterServer';
import { DefaultRepeaterEventHub } from './DefaultRepeaterEventHub';
import {
  RepeaterErrorCodes,
  RepeaterEventHub,
  RepeaterServerEventHandler,
  RepeaterServerEvents,
  RepeaterServerEventsMap,
  RepeaterServerRequestEvent
} from './RepeaterEventHub';
import { RepeaterCommandHub } from './RepeaterCommandHub';
import { delay, Logger } from '@sectester/core';
import {
  anything,
  deepEqual,
  instance,
  mock,
  objectContaining,
  reset,
  verify,
  when
} from 'ts-mockito';

describe('DefaultRepeaterBus', () => {
  const RepeaterId = 'fooId';

  let events!: RepeaterEventHub;
  let sut!: DefaultRepeaterBus;

  const mockedRepeaterServer = mock<RepeaterServer>();
  const mockedRepeaterCommandHub = mock<RepeaterCommandHub>();
  const mockedLogger = mock<Logger>();

  beforeEach(() => {
    events = new DefaultRepeaterEventHub();

    when(mockedRepeaterServer.events).thenReturn(events);

    sut = new DefaultRepeaterBus(
      RepeaterId,
      instance(mockedLogger),
      instance(mockedRepeaterServer),
      instance(mockedRepeaterCommandHub)
    );
  });

  afterEach(() =>
    reset<RepeaterServer | RepeaterCommandHub | Logger>(
      mockedRepeaterServer,
      mockedRepeaterCommandHub,
      mockedLogger
    )
  );
  describe('constructor', () => {
    it('should provide error handler', async () => {
      // arrange
      const error = new Error('test error');
      const args = ['arg1', 'arg2'];

      const handler: RepeaterServerEventHandler<any> = jest
        .fn()
        .mockRejectedValue(error);
      const event = 'testEvent';

      events.on(event as keyof RepeaterServerEventsMap, handler);

      // act
      events.emit(event as RepeaterServerEvents, ...args);

      // assert
      await delay(200);
      verify(
        mockedLogger.debug(
          'An error occurred while processing the %s event with the following payload: %j',
          event,
          deepEqual(['arg1', 'arg2'])
        )
      ).once();
      verify(mockedLogger.error(error)).once();
    });
  });

  describe('connect', () => {
    it('should connect', async () => {
      // act
      await sut.connect();

      // assert
      verify(mockedRepeaterServer.connect(RepeaterId)).once();
      verify(
        mockedRepeaterServer.deploy(
          objectContaining({ repeaterId: RepeaterId })
        )
      ).once();
    });

    it('should allow connect more than once', async () => {
      // arrange
      await sut.connect();

      // act
      const act = sut.connect();

      // assert
      await expect(act).resolves.not.toThrow();
    });

    it('should throw when underlying connect throws', async () => {
      // arrange
      when(mockedRepeaterServer.connect(RepeaterId)).thenReject(
        new Error('foo')
      );

      // act
      const act = () => sut.connect();

      // assert
      await expect(act).rejects.toThrowError('foo');
    });

    it('should throw when underlying deploy throws', async () => {
      // arrange
      when(mockedRepeaterServer.deploy(anything())).thenReject(
        new Error('foo')
      );

      // act
      const act = () => sut.connect();

      // assert
      await expect(act).rejects.toThrowError('foo');
    });
  });

  describe('close', () => {
    it('should close', async () => {
      // act
      await sut.close();

      // assert
      verify(mockedRepeaterServer.disconnect()).once();
    });
  });

  describe('events', () => {
    it(`should subscribe to ${RepeaterServerEvents.UPDATE_AVAILABLE}`, async () => {
      // arrange
      await sut.connect();

      // act
      events.emit(RepeaterServerEvents.UPDATE_AVAILABLE, { version: '1.0.0' });

      // assert
      verify(
        mockedLogger.warn(
          '%s: A new Repeater version (%s) is available, for update instruction visit https://docs.brightsec.com/docs/installation-options',
          anything(),
          '1.0.0'
        )
      ).once();
    });

    it(`should subscribe to ${RepeaterServerEvents.REQUEST}`, async () => {
      // arrange
      const requestEvent: RepeaterServerRequestEvent = {
        protocol: Protocol.HTTP,
        url: 'http://foo.bar',
        method: 'GET'
      };

      const request = new Request(requestEvent);

      when(mockedRepeaterCommandHub.sendRequest(anything())).thenResolve(
        new Response({
          protocol: Protocol.HTTP,
          statusCode: 200
        })
      );

      await sut.connect();

      // act
      events.emit(RepeaterServerEvents.REQUEST, requestEvent);

      // assert
      await delay(200);
      verify(
        mockedRepeaterCommandHub.sendRequest(objectContaining(request))
      ).once();
    });

    it(`should subscribe to ${RepeaterServerEvents.RECONNECT_ATTEMPT}`, async () => {
      // arrange
      await sut.connect();

      // act
      events.emit(RepeaterServerEvents.RECONNECT_ATTEMPT, {
        attempt: 1,
        maxAttempts: 3
      });

      // assert
      verify(
        mockedLogger.warn(
          'Failed to connect to Bright cloud (attempt %d/%d)',
          anything(),
          anything()
        )
      ).once();
    });

    it(`should subscribe to ${RepeaterServerEvents.ERROR} and proceed on error`, async () => {
      // arrange
      await sut.connect();

      // act
      events.emit(RepeaterServerEvents.ERROR, {
        code: RepeaterErrorCodes.UNKNOWN_ERROR,
        message: 'error'
      });

      // assert
      verify(mockedLogger.error('error')).once();
    });

    it(`should subscribe to ${RepeaterServerEvents.ERROR} and proceed on critical error`, async () => {
      // arrange
      await sut.connect();

      // act
      events.emit(RepeaterServerEvents.ERROR, {
        code: RepeaterErrorCodes.UNEXPECTED_ERROR,
        message: 'unexpected error',
        remediation: 'remediation'
      });

      // assert
      verify(
        mockedLogger.error(
          '%s: %s. %s',
          anything(),
          'unexpected error',
          'remediation'
        )
      ).once();
      verify(mockedRepeaterServer.disconnect()).once();
    });

    it(`should subscribe to ${RepeaterServerEvents.RECONNECTION_FAILED}`, async () => {
      // arrange
      const error = new Error('test error');
      await sut.connect();

      // act
      events.emit(RepeaterServerEvents.RECONNECTION_FAILED, {
        error
      });

      // assert
      verify(mockedLogger.error(error)).once();
      verify(mockedRepeaterServer.disconnect()).once();
    });

    it(`should subscribe to ${RepeaterServerEvents.RECONNECTION_SUCCEEDED}`, async () => {
      // arrange
      await sut.connect();

      // act
      events.emit(RepeaterServerEvents.RECONNECTION_SUCCEEDED);

      // assert
      verify(
        mockedLogger.log('The Repeater (%s) connected', RepeaterId)
      ).once();
    });
  });
});
