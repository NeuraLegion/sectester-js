import { RetryHandler } from './RetryHandler';
import { ApiError } from '../exceptions/ApiError';
import { RateLimitError } from '../exceptions/RateLimitError';

describe('RetryHandler', () => {
  const defaultConfig = {
    maxRetries: 3,
    baseDelay: 10,
    maxDelay: 100,
    jitterFactor: 0.1
  };

  let sut: RetryHandler;

  beforeEach(() => {
    sut = new RetryHandler(defaultConfig);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('executeWithRetry', () => {
    it('should execute operation successfully without retries', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await sut.executeWithRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on network error', async () => {
      const networkError = new TypeError('NetworkError');
      const operation = jest
        .fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce('success');

      const result = await sut.executeWithRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should retry on timeout error', async () => {
      const timeoutError = new DOMException('Timeout', 'TimeoutError');
      const operation = jest
        .fn()
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce('success');

      const result = await sut.executeWithRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should retry on rate limit error and respect retry-after', async () => {
      const rateLimitError = new RateLimitError(
        new Response('', { headers: { 'Retry-After': '1' } }),
        1
      );
      const operation = jest
        .fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce('success');

      const resultPromise = sut.executeWithRetry(operation);
      await jest.runOnlyPendingTimersAsync();
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should retry on retriable API errors', async () => {
      const apiError = new ApiError(
        new Response('Service Unavailable', { status: 503 })
      );
      const operation = jest
        .fn()
        .mockRejectedValueOnce(apiError)
        .mockResolvedValueOnce('success');

      const result = await sut.executeWithRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry non-idempotent operations', async () => {
      const apiError = new ApiError(
        new Response('Bad Request', { status: 400 })
      );
      const operation = jest.fn().mockRejectedValue(apiError);

      await expect(sut.executeWithRetry(operation, false)).rejects.toThrow(
        ApiError
      );
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retries', async () => {
      const apiError = new ApiError(
        new Response('Service Unavailable', { status: 503 })
      );
      const operation = jest.fn().mockRejectedValue(apiError);

      await expect(sut.executeWithRetry(operation)).rejects.toThrow(ApiError);
      expect(operation).toHaveBeenCalledTimes(defaultConfig.maxRetries + 1);
    });

    it('should not retry on non-retriable errors', async () => {
      const error = new Error('Regular error');
      const operation = jest.fn().mockRejectedValue(error);

      await expect(sut.executeWithRetry(operation)).rejects.toThrow(
        'Regular error'
      );
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should not retry on non-retriable status codes', async () => {
      const apiError = new ApiError(
        new Response('Bad Request', { status: 400 })
      );
      const operation = jest.fn().mockRejectedValue(apiError);

      await expect(sut.executeWithRetry(operation)).rejects.toThrow(ApiError);
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });
});
