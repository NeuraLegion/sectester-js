import { ApiError } from '../exceptions/ApiError';
import { RateLimitError } from '../exceptions/RateLimitError';
import { setTimeout } from 'node:timers/promises';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  jitterFactor: number;
}

export interface RetryOptions {
  idempotent?: boolean;
  signal?: AbortSignal;
}

export class RetryHandler {
  private static readonly RETRIABLE_STATUS_CODES: ReadonlySet<number> = new Set(
    [408, 409, 429, 500, 502, 503, 504]
  );

  constructor(private readonly config: RetryConfig) {}

  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const { idempotent = true, signal } = options;
    let attempt = 0;

    for (;;) {
      // Check if the operation has been aborted
      if (signal?.aborted) {
        throw signal.reason;
      }

      try {
        return await operation();
      } catch (error) {
        // eslint-disable-next-line max-depth
        if (signal?.aborted) {
          throw error;
        }

        await this.handleRetryableError(error, attempt, idempotent, signal);
        attempt++;
      }
    }
  }

  private async handleRetryableError(
    error: unknown,
    attempt: number,
    idempotent: boolean,
    signal?: AbortSignal
  ): Promise<void> {
    if (attempt >= this.config.maxRetries) {
      throw error;
    }

    const isEligibleForRetry =
      (this.isRetryableError(error) && idempotent) ||
      this.isNetworkError(error);
    if (!isEligibleForRetry) {
      throw error;
    }

    const delay: number =
      error instanceof RateLimitError
        ? error.retryAfter * 1000
        : this.calculateBackoff(attempt);

    await setTimeout(delay, undefined, { signal });
  }

  private isRetryableError(error: unknown): boolean {
    // Don't retry if the operation was deliberately aborted
    if (error instanceof DOMException && error.name === 'AbortError') {
      return false;
    }

    return (
      error instanceof RateLimitError ||
      (error instanceof ApiError &&
        RetryHandler.RETRIABLE_STATUS_CODES.has(error.response.status)) ||
      this.isTimeoutError(error)
    );
  }

  private isNetworkError(error: unknown): boolean {
    return (
      error instanceof TypeError &&
      (error.message.includes('fetch failed') ||
        error.message.includes('terminated'))
    );
  }

  private isTimeoutError(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'TimeoutError';
  }

  private calculateBackoff(attempt: number): number {
    const delay = Math.min(
      this.config.maxDelay,
      this.config.baseDelay * Math.pow(2, attempt)
    );
    const jitter = delay * this.config.jitterFactor * Math.random();

    return delay + jitter;
  }
}
