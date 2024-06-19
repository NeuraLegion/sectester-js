import { RunningStatus } from './Repeater';
import { DefaultRepeater } from './DefaultRepeater';
import { Protocol } from '../models/Protocol';
import { Request, Response } from '../request-runner';
import { RepeaterBridgesOptions } from './RepeaterBridgesOptions';
import {
  RepeaterErrorCodes,
  RepeaterServer,
  RepeaterServerEvents,
  RepeaterServerRequestEvent
} from './RepeaterServer';
import { RepeaterCommands } from './RepeaterCommands';
import { delay, Logger } from '@sectester/core';
import {
  anything,
  instance,
  mock,
  objectContaining,
  reset,
  verify,
  when
} from 'ts-mockito';
import { EventEmitter } from 'events';

describe('DefaultRepeater', () => {
  const RepeaterId = 'fooId';
  const RepeaterNamePrefix = 'localhost';

  let events!: EventEmitter;
  let sut!: DefaultRepeater;

  const mockedRepeaterBridgesOptions = mock<RepeaterBridgesOptions>();
  const mockedRepeaterServer = mock<RepeaterServer>();
  const repeaterCommands = mock<RepeaterCommands>();
  const mockedLogger = mock<Logger>();

  beforeEach(() => {
    events = new EventEmitter();
    when(mockedRepeaterServer.on(anything(), anything())).thenCall(
      (event, handler) => {
        events.on(event, handler);
      }
    );

    when(mockedRepeaterServer.off(anything(), anything())).thenCall(
      (event, listener) => {
        events.off(event, listener);
      }
    );

    when(mockedRepeaterServer.deploy()).thenResolve({
      repeaterId: RepeaterId
    });

    when(mockedRepeaterBridgesOptions.domain).thenReturn(RepeaterNamePrefix);

    sut = new DefaultRepeater(
      instance(mockedRepeaterBridgesOptions),
      instance(mockedLogger),
      instance(mockedRepeaterServer),
      instance(repeaterCommands)
    );
  });

  afterEach(() =>
    reset<RepeaterServer | RepeaterCommands | Logger>(
      mockedRepeaterServer,
      repeaterCommands,
      mockedLogger
    )
  );

  describe('start', () => {
    it('should start', async () => {
      // act
      await sut.start();

      // assert
      verify(mockedRepeaterServer.connect(RepeaterNamePrefix)).once();
      verify(mockedRepeaterServer.deploy()).once();
    });

    it('should throw when underlying connect throws', async () => {
      // arrange
      when(mockedRepeaterServer.connect(RepeaterNamePrefix)).thenReject(
        new Error('foo')
      );

      // act
      const act = () => sut.start();

      // assert
      await expect(act).rejects.toThrowError('foo');
    });

    it('should throw when underlying deploy throws', async () => {
      // arrange
      when(mockedRepeaterServer.deploy()).thenReject(new Error('foo'));

      // act
      const act = () => sut.start();

      // assert
      await expect(act).rejects.toThrowError('foo');
    });

    it('should have RunningStatus.STARTING just after start() call', () => {
      // act
      void sut.start();

      // assert
      expect(sut.runningStatus).toBe(RunningStatus.STARTING);
    });

    it('should have RunningStatus.RUNNING after successful start()', async () => {
      // act
      await sut.start();

      // assert
      expect(sut.runningStatus).toBe(RunningStatus.RUNNING);
    });

    it('should throw an error on start() twice', async () => {
      // arrange
      await sut.start();

      // act
      const res = sut.start();

      // assert
      await expect(res).rejects.toThrow('Repeater is already active.');
    });

    it('should be possible to start() after start() error', async () => {
      // act
      when(mockedRepeaterServer.connect(RepeaterNamePrefix))
        .thenReject()
        .thenResolve();

      // assert
      await expect(sut.start()).rejects.toThrow();
      await expect(sut.start()).resolves.not.toThrow();
    });
  });

  describe('stop', () => {
    it('should stop', async () => {
      // arrange
      await sut.start();

      // act
      await sut.stop();

      // assert
      verify(mockedRepeaterServer.disconnect()).once();
    });

    it('should have RunningStatus.OFF after start() and stop()', async () => {
      // arrange
      await sut.start();

      // act
      await sut.stop();

      // assert
      expect(sut.runningStatus).toBe(RunningStatus.OFF);
    });

    it('should do nothing on stop() without start()', async () => {
      // act
      await sut.stop();

      // assert
      expect(sut.runningStatus).toBe(RunningStatus.OFF);
    });

    it('should do nothing on second stop() call', async () => {
      // arrange
      await sut.start();
      await sut.stop();

      // assert
      await sut.stop();

      // assert
      expect(sut.runningStatus).toBe(RunningStatus.OFF);
    });
  });

  describe('runningStatus', () => {
    it('should have RunningStatus.OFF initially', () => {
      // assert
      expect(sut.runningStatus).toBe(RunningStatus.OFF);
    });
  });

  describe('events', () => {
    it(`should subscribe to ${RepeaterServerEvents.UPDATE_AVAILABLE}`, async () => {
      // arrange
      await sut.start();

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

      when(repeaterCommands.sendRequest(anything())).thenResolve(
        new Response({
          protocol: Protocol.HTTP,
          statusCode: 200
        })
      );

      await sut.start();

      // act
      events.emit(RepeaterServerEvents.REQUEST, requestEvent);

      // assert
      await delay(200);
      verify(repeaterCommands.sendRequest(objectContaining(request))).once();
    });

    it(`should subscribe to ${RepeaterServerEvents.RECONNECT_ATTEMPT}`, async () => {
      // arrange
      await sut.start();

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
      await sut.start();

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
      await sut.start();

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
      await sut.start();

      // act
      events.emit(RepeaterServerEvents.RECONNECTION_FAILED, {
        error
      });

      // assert
      verify(mockedLogger.error(error.message)).once();
      verify(mockedRepeaterServer.disconnect()).once();
    });

    it(`should subscribe to ${RepeaterServerEvents.RECONNECTION_SUCCEEDED}`, async () => {
      // arrange
      await sut.start();

      // act
      events.emit(RepeaterServerEvents.RECONNECTION_SUCCEEDED);

      // assert
      verify(
        mockedLogger.log('The Repeater (%s) connected', RepeaterId)
      ).once();
    });
  });
});
