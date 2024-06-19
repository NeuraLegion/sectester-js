import { Repeater, RunningStatus } from './Repeater';
import { Protocol } from '../models/Protocol';
import { Request, Response } from '../request-runner';
import {
  RepeaterErrorCodes,
  RepeaterServer,
  RepeaterServerEvents,
  RepeaterServerRequestEvent
} from './RepeaterServer';
import { RepeaterCommands } from './RepeaterCommands';
import { Logger } from '@sectester/core';
import {
  anything,
  instance,
  mock,
  objectContaining,
  reset,
  verify,
  when
} from 'ts-mockito';

describe('Repeater', () => {
  const RepeaterId = 'fooId';

  let sut!: Repeater;

  const mockedRepeaterServer = mock<RepeaterServer>();
  const repeaterCommands = mock<RepeaterCommands>();
  const mockedLogger = mock<Logger>();

  beforeEach(() => {
    when(mockedRepeaterServer.deploy(anything())).thenResolve({
      repeaterId: RepeaterId
    });

    sut = new Repeater(
      RepeaterId,
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
      verify(mockedRepeaterServer.connect()).once();
      verify(
        mockedRepeaterServer.deploy(
          objectContaining({ repeaterId: RepeaterId })
        )
      ).once();
    });

    it('should throw when underlying connect throws', async () => {
      // arrange
      when(mockedRepeaterServer.connect()).thenReject(new Error('foo'));

      // act
      const act = () => sut.start();

      // assert
      await expect(act).rejects.toThrowError('foo');
    });

    it('should throw when underlying deploy throws', async () => {
      // arrange
      when(mockedRepeaterServer.deploy(anything())).thenReject(
        new Error('foo')
      );

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
      when(mockedRepeaterServer.connect()).thenReject().thenResolve();

      // assert
      await expect(sut.start()).rejects.toThrow();
      await expect(sut.start()).resolves.not.toThrow();
    });

    it(`should subscribe to ${RepeaterServerEvents.UPDATE_AVAILABLE} and proceed on event`, async () => {
      // arrange
      let eventHandler!: (event: unknown) => void;

      when(
        mockedRepeaterServer.on(
          RepeaterServerEvents.UPDATE_AVAILABLE,
          anything()
        )
      ).thenCall((_, handler) => {
        eventHandler = handler;
      });

      await sut.start();

      // act
      eventHandler({ version: '1.0.0' });

      // assert
      verify(
        mockedLogger.warn(
          '%s: A new Repeater version (%s) is available, for update instruction visit https://docs.brightsec.com/docs/installation-options',
          anything(),
          '1.0.0'
        )
      ).once();
    });

    it(`should subscribe to ${RepeaterServerEvents.REQUEST} and proceed on event`, async () => {
      // arrange
      let eventHandler!: (event: unknown) => Promise<Response>;

      when(
        mockedRepeaterServer.on(RepeaterServerEvents.REQUEST, anything())
      ).thenCall((_, handler) => {
        eventHandler = handler;
      });

      const requestEvent: RepeaterServerRequestEvent = {
        protocol: Protocol.HTTP,
        url: 'http://foo.bar',
        method: 'GET'
      };

      const request = new Request(requestEvent);

      const response = new Response({
        protocol: Protocol.HTTP,
        statusCode: 200
      });

      when(repeaterCommands.sendRequest(objectContaining(request))).thenResolve(
        response
      );

      await sut.start();

      // act
      const result = await eventHandler(requestEvent);

      // assert
      expect(result).toMatchObject(response);
    });

    it(`should subscribe to ${RepeaterServerEvents.RECONNECT_ATTEMPT} and proceed on event`, async () => {
      // arrange
      let eventHandler!: (event: unknown) => void;

      when(
        mockedRepeaterServer.on(
          RepeaterServerEvents.RECONNECT_ATTEMPT,
          anything()
        )
      ).thenCall((_, handler) => {
        eventHandler = handler;
      });

      await sut.start();

      // act
      eventHandler({
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
      let eventHandler!: (event: unknown) => void;

      when(
        mockedRepeaterServer.on(RepeaterServerEvents.ERROR, anything())
      ).thenCall((_, handler) => {
        eventHandler = handler;
      });

      await sut.start();

      // act
      eventHandler({
        code: RepeaterErrorCodes.UNKNOWN_ERROR,
        message: 'error'
      });

      // assert
      verify(mockedLogger.error('error')).once();
    });

    it(`should subscribe to ${RepeaterServerEvents.ERROR} and proceed on critical error`, async () => {
      // arrange
      let eventHandler!: (event: unknown) => void;

      when(
        mockedRepeaterServer.on(RepeaterServerEvents.ERROR, anything())
      ).thenCall((_, handler) => {
        eventHandler = handler;
      });

      await sut.start();

      // act
      eventHandler({
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

    it(`should subscribe to ${RepeaterServerEvents.RECONNECTION_FAILED} and proceed on event`, async () => {
      // arrange
      const error = new Error('test error');

      let eventHandler!: (event: unknown) => void;

      when(
        mockedRepeaterServer.on(
          RepeaterServerEvents.RECONNECTION_FAILED,
          anything()
        )
      ).thenCall((_, handler) => {
        eventHandler = handler;
      });

      await sut.start();

      // act
      eventHandler({
        error
      });

      // assert
      verify(mockedLogger.error(error.message)).once();
      verify(mockedRepeaterServer.disconnect()).once();
    });

    it(`should subscribe to ${RepeaterServerEvents.RECONNECTION_SUCCEEDED} and proceed on event`, async () => {
      // arrange
      let eventHandler!: () => void;

      when(
        mockedRepeaterServer.on(
          RepeaterServerEvents.RECONNECTION_SUCCEEDED,
          anything()
        )
      ).thenCall((_, handler) => {
        eventHandler = handler;
      });

      await sut.start();

      // act
      eventHandler();

      // assert
      verify(
        mockedLogger.log('The Repeater (%s) connected', RepeaterId)
      ).once();
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
});
