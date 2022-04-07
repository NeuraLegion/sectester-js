import { ExponentialBackoffRetryStrategy } from './ExponentialBackoffRetryStrategy';

describe('ExponentialBackoffRetryStrategy', () => {
  const extendSetTimeoutMock = () => {
    const mockImplamentation = jest
      .spyOn(global, 'setTimeout')
      .getMockImplementation();

    jest
      .spyOn(global, 'setTimeout')
      .mockImplementation((ms: any, callback: any) => {
        const res = mockImplamentation?.(callback, ms);
        jest.runAllTimers();

        return res as any;
      });
  };

  afterEach(() => jest.useRealTimers());

  it('should not retry if function does not throw error', async () => {
    jest.useFakeTimers();
    extendSetTimeoutMock();
    const retryStrategy = new ExponentialBackoffRetryStrategy({ maxDepth: 1 });
    const input = jest.fn().mockResolvedValue(undefined);

    await retryStrategy.acquire(input);

    expect(input).toHaveBeenCalledTimes(1);
  });

  it('should return a result execution immediately', async () => {
    jest.useFakeTimers();
    extendSetTimeoutMock();
    const retryStrategy = new ExponentialBackoffRetryStrategy({ maxDepth: 1 });
    const input = jest.fn().mockReturnValue(undefined);

    await retryStrategy.acquire(input);

    expect(input).toHaveBeenCalledTimes(1);
  });

  it('should prevent retries if error does not have a correct code', async () => {
    jest.useFakeTimers();
    extendSetTimeoutMock();
    const retryStrategy = new ExponentialBackoffRetryStrategy({ maxDepth: 1 });
    const input = jest.fn().mockRejectedValue(new Error('Unhandled error'));

    const result = retryStrategy.acquire(input);

    await expect(result).rejects.toThrow('Unhandled error');
    expect(input).toHaveBeenCalledTimes(1);
  });

  it('should retry two times and throw an error', async () => {
    jest.useFakeTimers();
    extendSetTimeoutMock();
    const retryStrategy = new ExponentialBackoffRetryStrategy({ maxDepth: 2 });
    const error = new Error('Unhandled error');
    (error as any).code = 'ECONNRESET';
    const input = jest.fn().mockRejectedValue(error);

    const result = retryStrategy.acquire(input);

    await expect(result).rejects.toThrow(error);
    expect(input).toHaveBeenCalledTimes(3);
  });

  it('should return a result execution after a two retries', async () => {
    jest.useFakeTimers();
    extendSetTimeoutMock();
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
