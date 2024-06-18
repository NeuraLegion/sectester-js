import { Repeater, RunningStatus } from './Repeater';
import { RepeaterBus } from '../bus';
import { instance, mock, reset, verify, when } from 'ts-mockito';

describe('Repeater', () => {
  const repeaterId = 'fooId';

  let repeater!: Repeater;
  const mockedRepeaterBus = mock<RepeaterBus>();

  const createRepeater = () =>
    new Repeater(repeaterId, instance(mockedRepeaterBus));

  beforeEach(() => {
    repeater = createRepeater();
  });

  afterEach(() => reset<RepeaterBus>(mockedRepeaterBus));

  describe('start', () => {
    it('should start', async () => {
      // act
      await repeater.start();

      // assert
      verify(mockedRepeaterBus.connect()).once();
    });

    it('should have RunningStatus.STARTING just after start() call', () => {
      // act
      void repeater.start();

      // assert
      expect(repeater.runningStatus).toBe(RunningStatus.STARTING);
    });

    it('should have RunningStatus.RUNNING after successful start()', async () => {
      // act
      await repeater.start();

      // assert
      expect(repeater.runningStatus).toBe(RunningStatus.RUNNING);
    });

    it('should throw an error on start() twice', async () => {
      // arrange
      await repeater.start();

      // act
      const res = repeater.start();

      // assert
      await expect(res).rejects.toThrow('Repeater is already active.');
    });

    it('should be possible to start() after start() error', async () => {
      // act
      when(mockedRepeaterBus.connect()).thenReject().thenResolve();

      // assert
      await expect(repeater.start()).rejects.toThrow();
      await expect(repeater.start()).resolves.not.toThrow();
    });
  });

  describe('stop', () => {
    it('should stop', async () => {
      // arrange
      await repeater.start();

      // act
      await repeater.stop();

      // assert
      verify(mockedRepeaterBus.close()).once();
    });

    it('should have RunningStatus.OFF after start() and stop()', async () => {
      // arrange
      await repeater.start();

      // act
      await repeater.stop();

      // assert
      expect(repeater.runningStatus).toBe(RunningStatus.OFF);
    });

    it('should do nothing on stop() without start()', async () => {
      // act
      await repeater.stop();

      // assert
      expect(repeater.runningStatus).toBe(RunningStatus.OFF);
    });

    it('should do nothing on second stop() call', async () => {
      // arrange
      await repeater.start();
      await repeater.stop();

      // assert
      await repeater.stop();

      // assert
      expect(repeater.runningStatus).toBe(RunningStatus.OFF);
    });
  });

  describe('runningStatus', () => {
    it('should have RunningStatus.OFF initially', () => {
      // assert
      expect(repeater.runningStatus).toBe(RunningStatus.OFF);
    });
  });
});
