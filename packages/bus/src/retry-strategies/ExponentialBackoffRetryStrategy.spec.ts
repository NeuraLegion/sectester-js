import { ExponentialBackoffRetryStrategy } from './ExponentialBackoffRetryStrategy';
import { HttpCommandError } from '../exceptions';
import { AxiosRequestConfig } from 'axios';

class TestError extends Error {
  constructor(
    options:
      | { code: number | string | undefined }
      | { status: number | undefined; method: string | undefined } = {
      status: undefined,
      method: undefined
    }
  ) {
    super('Something went wrong.');
    Object.assign(this, options);
    this.name = new.target.name;
  }
}

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

  describe('acquire', () => {
    it('should not retry if function does not throw error', async () => {
      const retryStrategy = new ExponentialBackoffRetryStrategy({
        maxDepth: 1
      });
      const input = jest.fn().mockResolvedValue(undefined);

      await retryStrategy.acquire(input);

      expect(input).toHaveBeenCalledTimes(1);
    });

    it('should return a result execution immediately', async () => {
      const retryStrategy = new ExponentialBackoffRetryStrategy({
        maxDepth: 1
      });
      const input = jest.fn().mockReturnValue(undefined);

      await retryStrategy.acquire(input);

      expect(input).toHaveBeenCalledTimes(1);
    });

    it('should prevent retries if error does not have a code', async () => {
      const retryStrategy = new ExponentialBackoffRetryStrategy({
        maxDepth: 1
      });
      const input = jest.fn().mockRejectedValue(new Error('Unhandled error'));

      const result = retryStrategy.acquire(input);

      await expect(result).rejects.toThrow('Unhandled error');
      expect(input).toHaveBeenCalledTimes(1);
    });

    it('should prevent retries if error does not have a correct code', async () => {
      const retryStrategy = new ExponentialBackoffRetryStrategy({
        maxDepth: 1
      });
      const error = new Error('Unhandled error');
      Object.assign(error, { code: 'ENETDOWN' });
      const input = jest.fn().mockRejectedValue(error);

      const result = retryStrategy.acquire(input);

      await expect(result).rejects.toThrow('Unhandled error');
      expect(input).toHaveBeenCalledTimes(1);
    });

    it('should prevent retries if HTTP method is not idempotent', async () => {
      const retryStrategy = new ExponentialBackoffRetryStrategy({
        maxDepth: 1
      });
      const config: AxiosRequestConfig<undefined> = { method: 'POST' };
      const error = new HttpCommandError({
        config,
        name: 'Error',
        response: {
          config,
          status: 500,
          statusText: 'Internal server error',
          headers: {},
          data: undefined
        },
        message: 'Unhandled error',
        isAxiosError: true,
        toJSON() {
          return {};
        }
      });
      const input = jest.fn().mockRejectedValue(error);

      const result = retryStrategy.acquire(input);

      await expect(result).rejects.toThrow('Unhandled error');
      expect(input).toHaveBeenCalledTimes(1);
    });

    it('should prevent retries if error does not have a correct amqp code', async () => {
      const retryStrategy = new ExponentialBackoffRetryStrategy({
        maxDepth: 1
      });
      const error = new Error('Unhandled error');
      Object.assign(error, { code: 300 });
      const input = jest.fn().mockRejectedValue(error);

      const result = retryStrategy.acquire(input);

      await expect(result).rejects.toThrow('Unhandled error');
      expect(input).toHaveBeenCalledTimes(1);
    });

    it.each([
      ...[
        'ECONNRESET',
        'ETIMEDOUT',
        'ECONNREFUSED',
        'ENETUNREACH',
        'ENOTFOUND',
        'EADDRINUSE',
        'EHOSTUNREACH',
        'EPIPE',
        'EAI_AGAIN'
      ].map((code: string) => new TestError({ code })),
      ...[311, 312, 313, 320, 404, 405, 406, 502, 503, 504, 505, 506].map(
        (code: number) => new TestError({ code })
      ),
      ...['get', 'head', 'options', 'put', 'delete'].flatMap((method: string) =>
        Array(12)
          .fill(500)
          .map(
            (_: unknown, idx: number) =>
              new TestError({
                method,
                status: 500 + idx
              })
          )
      )
    ])('should retry on the error (%j)', async (error: Error) => {
      const retryStrategy = new ExponentialBackoffRetryStrategy({
        maxDepth: 2
      });
      const input = jest.fn().mockRejectedValue(error);

      const result = retryStrategy.acquire(input);

      await expect(result).rejects.toThrow(error);
      expect(input).toHaveBeenCalledTimes(3);
    });

    it('should return a result execution after a two retries', async () => {
      const retryStrategy = new ExponentialBackoffRetryStrategy({
        maxDepth: 2
      });
      const error = new TestError({ code: 'ECONNRESET' });
      const input = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValue(undefined);

      await retryStrategy.acquire(input);

      expect(input).toHaveBeenCalledTimes(3);
    });

    it('should throw error without retries if axios error has no response', async () => {
      const retryStrategy = new ExponentialBackoffRetryStrategy({
        maxDepth: 2
      });
      const error = new TestError();
      const input = jest.fn().mockRejectedValueOnce(error);

      const result = retryStrategy.acquire(input);

      expect(input).toHaveBeenCalledTimes(1);
      await expect(result).rejects.toThrow();
    });
  });
});
