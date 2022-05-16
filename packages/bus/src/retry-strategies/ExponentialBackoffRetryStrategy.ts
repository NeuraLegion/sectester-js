import { HttpCommandError } from '../exceptions';
import { RetryStrategy, delay } from '@sec-tester/core';
import ErrnoException = NodeJS.ErrnoException;

export interface ExponentialBackoffOptions {
  maxDepth: number;
}

export class ExponentialBackoffRetryStrategy implements RetryStrategy {
  private readonly NO_OPERATIONAL_ERROR_CODES: readonly number[] = [
    405, 406, 404, 313, 312, 311, 320
  ];
  private readonly NO_OPERATIONAL_ERRORS: readonly string[] = [
    'ECONNRESET',
    'ENETDOWN',
    'ENETUNREACH',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'ENOTFOUND',
    'EAI_AGAIN'
  ];

  constructor(private readonly options: ExponentialBackoffOptions) {}

  public async acquire<T extends (...args: unknown[]) => unknown>(
    task: T
  ): Promise<ReturnType<T>> {
    let depth = 0;

    for (;;) {
      try {
        return (await task()) as ReturnType<T>;
      } catch (e) {
        depth++;

        // eslint-disable-next-line max-depth
        if (!this.shouldRetry(e) || depth > this.options.maxDepth) {
          throw e;
        }

        await delay(2 ** depth * 50);
      }
    }
  }

  private shouldRetry(err: unknown): boolean {
    const code = (err as ErrnoException).code;

    if (code) {
      return (
        this.NO_OPERATIONAL_ERRORS.includes(code) ||
        this.NO_OPERATIONAL_ERROR_CODES.includes(+code)
      );
    }

    const status = (err as HttpCommandError).status ?? 200;

    return status >= 500;
  }
}
