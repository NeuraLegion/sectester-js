import { ApiError } from '../exceptions/ApiError';
import { RateLimitError } from '../exceptions/RateLimitError';
import { ApiClient } from './ApiClient';
import { RateLimiter } from './RateLimiter';
import { RetryHandler } from './RetryHandler';

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  apiKeyPrefix?: string;
  timeout?: number;
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

  public async request(
    path: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const idempotent = FetchApiClient.IDEMPOTENT_METHODS.has(
      options.method?.toUpperCase() ?? 'GET'
    );

    return this.retryHandler.executeWithRetry(
      () => this.makeRequest(path, options),
      idempotent
    );
  }

  private async makeRequest(
    path: string,
    options: RequestInit
  ): Promise<Response> {
    const url = new URL(path, this.config.baseUrl);
    const signal = AbortSignal.timeout(this.config.timeout ?? 5000);

    const response = await fetch(url.toString(), {
      ...options,
      headers: this.getHeaders(),
      signal: options.signal ?? signal
    });

    return this.handleResponse(response);
  }

  private async handleResponse(response: Response): Promise<Response> {
    if (!response.ok) {
      if (response.status === 409 && response.headers.has('Location')) {
        const locationPath = response.headers.get('Location');
        // eslint-disable-next-line max-depth
        if (locationPath) {
          // Handle both absolute and relative URLs
          const locationUrl = new URL(locationPath, this.config.baseUrl);

          return this.request(locationUrl.toString());
        }
      }

      const rateLimitInfo = this.rateLimiter.extractRateLimitInfo(response);

      if (response.status === 429 && response.headers.has('Retry-After')) {
        const retryAfter = parseInt(
          response.headers.get('Retry-After') ?? rateLimitInfo.reset.toString(),
          10
        );
        throw new RateLimitError(response, retryAfter);
      }

      throw new ApiError(response);
    }

    return response;
  }

  private getHeaders(): Headers {
    const headers = new Headers({
      'Content-Type': 'application/json'
    });

    if (this.config.apiKey) {
      const prefix = this.config.apiKeyPrefix ?? 'Api-Key';
      headers.set('Authorization', `${prefix} ${this.config.apiKey}`);
    }

    return headers;
  }
}
