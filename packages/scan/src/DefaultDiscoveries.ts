import { Target } from './target';
import { Discoveries } from './Discoveries';
import { inject, injectable } from 'tsyringe';
import { ApiClient, Configuration } from '@sectester/core';

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

    let response = await this.client.request(
      `/api/v2/projects/${this.configuration.projectId}/entry-points`,
      { ...requestOptions, method: 'POST' }
    );

    if (response.status === 409 && response.headers.has('location')) {
      const location = response.headers.get('location') as string;
      const putResponse = await this.client.request(location, {
        ...requestOptions,
        method: 'PUT'
      });

      if (!putResponse.ok) {
        const errorText = await putResponse.text();
        throw new Error(
          `Failed to update existing entrypoint at ${location}: ${errorText}`
        );
      }

      response = await this.client.request(location);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create entrypoint: ${errorText}`);
    }

    const data = (await response.json()) as { id: string };

    return data;
  }
}
