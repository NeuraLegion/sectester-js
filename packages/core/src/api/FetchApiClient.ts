import { ApiError } from '../exceptions/ApiError';
import { RateLimitError } from '../exceptions/RateLimitError';
import { ApiClient } from './ApiClient';
import { RateLimiter } from './RateLimiter';
import { RetryHandler } from './RetryHandler';
import { MIMEType } from 'node:util';
import { randomUUID } from 'node:crypto';

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  apiKeyPrefix?: string;
  timeout?: number;
  userAgent?: string;
}

export class FetchApiClient implements ApiClient {
  private static readonly IDEMPOTENT_METHODS: ReadonlySet<string> = new Set([
    'GET',
    'HEAD',
    'PUT',
    'DELETE',
    'OPTIONS',
    'TRACE'
  ]);
  private readonly retryHandler = new RetryHandler({
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    jitterFactor: 0.3
  });
  private readonly rateLimiter = new RateLimiter();

  constructor(private readonly config: ApiConfig) {}

  public async request(path: string, options?: RequestInit): Promise<Response> {
    const url = new URL(path, this.config.baseUrl);
    const requestOptions = {
      redirect: 'follow',
      keepalive: true,
      ...options,
      headers: this.createHeaders(options?.headers),
      method: (options?.method ?? 'GET').toUpperCase()
    } satisfies RequestInit;

    const idempotent = FetchApiClient.IDEMPOTENT_METHODS.has(
      requestOptions.method
    );

    return this.retryHandler.executeWithRetry(
      () => this.makeRequest(url, requestOptions),
      idempotent
    );
  }

  private async makeRequest(
    url: string | URL,
    options?: RequestInit
  ): Promise<Response> {
    const signal = AbortSignal.timeout(this.config.timeout ?? 5000);

    const response = await fetch(url, {
      ...options,
      signal: options?.signal ?? signal
    });

    return this.handleResponse(response);
  }

  // eslint-disable-next-line complexity
  private async handleResponse(response: Response): Promise<Response> {
    if (!response.ok) {
      if (response.status === 409 && response.headers.has('location')) {
        const locationPath = response.headers.get('location');
        // eslint-disable-next-line max-depth
        if (locationPath) {
          // Handle both absolute and relative URLs
          const locationUrl = new URL(locationPath, this.config.baseUrl);

          return this.request(locationUrl.toString());
        }
      }

      const rateLimitInfo = this.rateLimiter.extractRateLimitInfo(response);
      const mimeType = new MIMEType(response.headers.get('content-type') ?? '');

      const responseBody =
        mimeType.type === 'text' ? await response.clone().text() : undefined;

      if (response.status === 429) {
        const retryAfter = parseInt(
          response.headers.get('retry-after') ?? rateLimitInfo.reset.toString(),
          10
        );
        throw new RateLimitError(response, retryAfter, responseBody);
      }

      throw new ApiError(response, responseBody);
    }

    return response;
  }

  private createHeaders(
    headersInit: import('undici-types').HeadersInit = {}
  ): Headers {
    const headers = new Headers({
      ...headersInit,
      'idempotency-key': randomUUID(),
      ...(this.config.userAgent ? { 'user-agent': this.config.userAgent } : {})
    });

    if (this.config.apiKey) {
      const prefix = this.config.apiKeyPrefix ?? 'Api-Key';
      headers.set('authorization', `${prefix} ${this.config.apiKey}`);
    }

    return headers;
  }
}
