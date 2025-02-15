import { ApiError } from '../exceptions/ApiError';
import { RateLimitError } from '../exceptions/RateLimitError';
import { setTimeout } from 'node:timers/promises';

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  jitterFactor: number;
}

export class RetryHandler {
  private static readonly RETRIABLE_STATUS_CODES: ReadonlySet<number> = new Set(
    [408, 409, 429, 500, 502, 503, 504]
  );

  constructor(private readonly config: RetryConfig) {}

  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    idempotent = true
  ): Promise<T> {
    let attempt = 0;

    for (;;) {
      try {
        return await operation();
      } catch (error) {
        await this.handleRetryableError(error, attempt, idempotent);
        attempt++;
      }
    }
  }

  private async handleRetryableError(
    error: unknown,
    attempt: number,
    idempotent: boolean
  ): Promise<void> {
    if (
      attempt >= this.config.maxRetries ||
      !this.shouldRetry(error, idempotent)
    ) {
      throw error;
    }

    if (error instanceof RateLimitError) {
      await setTimeout(error.retryAfter * 1000);
    } else if (this.isRetryableError(error)) {
      await setTimeout(this.calculateBackoff(attempt));
    } else {
      throw error;
    }
  }

  private shouldRetry(error: unknown, idempotent: boolean): boolean {
    if (!idempotent) {
      return false;
    }

    return this.isRetryableError(error);
  }

  private isRetryableError(error: unknown): boolean {
    return (
      error instanceof RateLimitError ||
      (error instanceof ApiError &&
        RetryHandler.RETRIABLE_STATUS_CODES.has(error.response.status)) ||
      this.isNetworkError(error) ||
      this.isTimeoutError(error)
    );
  }

  private isNetworkError(error: unknown): boolean {
    return error instanceof TypeError && error.message.includes('NetworkError');
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
