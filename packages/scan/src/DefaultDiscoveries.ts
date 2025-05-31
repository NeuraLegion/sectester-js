import { Target } from './target';
import { Discoveries } from './Discoveries';
import { inject, injectable } from 'tsyringe';
import {
  ApiClient,
  Configuration,
  ApiError,
  ApiRequestInit
} from '@sectester/core';

@injectable()
export class DefaultDiscoveries implements Discoveries {
  private static readonly REQUEST_TIMEOUT = 120_000;

  constructor(
    private readonly configuration: Configuration,
    @inject(ApiClient)
    private readonly client: ApiClient
  ) {}

  public async createEntrypoint(
    target: Target,
    repeaterId: string
  ): Promise<{ id: string }> {
    const payload = {
      repeaterId,
      authObjectId: target.auth,
      request: {
        method: target.method,
        url: target.url,
        headers: target.headers,
        body: await target.text()
      }
    };

    const requestOptions = {
      signal: AbortSignal.timeout(DefaultDiscoveries.REQUEST_TIMEOUT),
      body: JSON.stringify(payload),
      headers: { 'content-type': 'application/json' }
    };

    try {
      const response = await this.client.request(
        `/api/v2/projects/${this.configuration.projectId}/entry-points`,
        { ...requestOptions, handle409Redirects: false, method: 'POST' }
      );

      const data = (await response.json()) as { id: string };

      return data;
    } catch (error) {
      if (this.isConflictError(error)) {
        return this.handleConflictError(error, requestOptions);
      }

      throw error;
    }
  }

  private isConflictError(error: unknown): error is ApiError {
    if (!(error instanceof ApiError) || error.response.status !== 409) {
      return false;
    }

    const location = error.response.headers.get('location');

    return !!location && location.trim() !== '';
  }

  private async handleConflictError(
    error: ApiError,
    requestOptions?: ApiRequestInit
  ): Promise<{ id: string }> {
    const location = error.response.headers.get('location') as string;

    try {
      await this.client.request(location, {
        ...requestOptions,
        method: 'PUT'
      });

      const response = await this.client.request(location);
      const data = (await response.json()) as { id: string };

      return data;
    } catch (putError) {
      if (putError instanceof ApiError) {
        throw new Error(
          `Failed to update existing entrypoint at ${location}: ${putError.message}`
        );
      }
      throw putError;
    }
  }
}
