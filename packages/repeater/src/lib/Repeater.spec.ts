import { Repeater, RunningStatus } from './Repeater';
import { RepeaterServer, RepeaterServerEvents } from './RepeaterServer';
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

    it.each([
      RepeaterServerEvents.UPDATE_AVAILABLE,
      RepeaterServerEvents.REQUEST,
      RepeaterServerEvents.RECONNECT_ATTEMPT,
      RepeaterServerEvents.ERROR,
      RepeaterServerEvents.RECONNECTION_FAILED,
      RepeaterServerEvents.RECONNECTION_SUCCEEDED,
      RepeaterServerEvents.CONNECTED
    ])(`should subscribe to %s`, async input => {
      // act
      await sut.start();

      // assert
      verify(mockedRepeaterServer.on(input, anything())).once();
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
