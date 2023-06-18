import { HttpCommandError } from '../exceptions';
import { RetryStrategy, delay } from '@sectester/core';
import ErrnoException = NodeJS.ErrnoException;

export interface ExponentialBackoffOptions {
  maxDepth: number;
}

export class ExponentialBackoffRetryStrategy implements RetryStrategy {
  private readonly RETRYABLE_AMQP_CODES: ReadonlySet<number> = new Set([
    311, 312, 313, 320, 404, 405, 406, 502, 503, 504, 505, 506
  ]);
  private readonly RETRYABLE_HTTP_METHODS: ReadonlySet<string> = new Set([
    'get',
    'head',
    'options',
    'put',
    'delete'
  ]);
  private readonly RETRYABLE_CODES: ReadonlySet<string> = new Set([
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'ENETUNREACH',
    'ENOTFOUND',
    'EADDRINUSE',
    'EHOSTUNREACH',
    'EPIPE',
    'EAI_AGAIN'
  ]);

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
    const code = (err as ErrnoException | { code: number }).code;

    if (typeof code === 'string') {
      return this.RETRYABLE_CODES.has(code);
    }

    if (typeof code === 'number') {
      return this.RETRYABLE_AMQP_CODES.has(+code);
    }

    const { status = 200, method = 'get' } = err as HttpCommandError;

    return (
      status >= 500 && this.RETRYABLE_HTTP_METHODS.has(method.toLowerCase())
    );
  }
}
