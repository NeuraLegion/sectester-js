import { ExponentialBackoffRetryStrategy } from './ExponentialBackoffRetryStrategy';

describe('ExponentialBackoffRetryStrategy', () => {
  const findArg = <R>(
    args: [unknown, unknown],
    expected: 'function' | 'number'
  ): R => (typeof args[0] === expected ? args[0] : args[1]) as R;

  beforeEach(() => {
    jest.useFakeTimers();

    const mockedImplementation = jest
      .spyOn(global, 'setTimeout')
      .getMockImplementation();

    jest
      .spyOn(global, 'setTimeout')
      .mockImplementation((...args: [unknown, unknown]) => {
        // ADHOC: depending on implementation (promisify vs raw), the method signature will be different
        const callback = findArg<(..._: unknown[]) => void>(args, 'function');
        const ms = findArg<number>(args, 'number');
        const timer = mockedImplementation?.(callback, ms);

        jest.runAllTimers();

        return timer as NodeJS.Timeout;
      });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it('should not retry if function does not throw error', async () => {
    const retryStrategy = new ExponentialBackoffRetryStrategy({ maxDepth: 1 });
    const input = jest.fn().mockResolvedValue(undefined);

    await retryStrategy.acquire(input);

    expect(input).toHaveBeenCalledTimes(1);
  });

  it('should return a result execution immediately', async () => {
    const retryStrategy = new ExponentialBackoffRetryStrategy({ maxDepth: 1 });
    const input = jest.fn().mockReturnValue(undefined);

    await retryStrategy.acquire(input);

    expect(input).toHaveBeenCalledTimes(1);
  });

  it('should prevent retries if error does not have a correct code', async () => {
    const retryStrategy = new ExponentialBackoffRetryStrategy({ maxDepth: 1 });
    const input = jest.fn().mockRejectedValue(new Error('Unhandled error'));

    const result = retryStrategy.acquire(input);

    await expect(result).rejects.toThrow('Unhandled error');
    expect(input).toHaveBeenCalledTimes(1);
  });

  it('should retry two times and throw an error', async () => {
    const retryStrategy = new ExponentialBackoffRetryStrategy({ maxDepth: 2 });
    const error = new Error('Unhandled error');
    (error as any).code = 'ECONNRESET';
    const input = jest.fn().mockRejectedValue(error);

    const result = retryStrategy.acquire(input);

    await expect(result).rejects.toThrow(error);
    expect(input).toHaveBeenCalledTimes(3);
  });

  it('should return a result execution after a two retries', async () => {
    const retryStrategy = new ExponentialBackoffRetryStrategy({ maxDepth: 2 });
    const error = new Error('Unhandled error');
    (error as any).code = 'ECONNRESET';
    const input = jest
      .fn()
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValue(undefined);

    await retryStrategy.acquire(input);

    expect(input).toHaveBeenCalledTimes(3);
  });
});
