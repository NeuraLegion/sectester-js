import { Target } from './target';
import { Discoveries } from './Discoveries';
import { inject, injectable } from 'tsyringe';
import { ApiClient, Configuration } from '@sectester/core';

@injectable()
export class DefaultDiscoveries implements Discoveries {
  constructor(
    private readonly configuration: Configuration,
    @inject(ApiClient)
    private readonly client: ApiClient
  ) {}

  public async createEntrypoint(
    target: Target,
    repeaterId: string
  ): Promise<{ id: string }> {
    if (!this.configuration.projectId) {
      throw new Error('Project ID is required.');
    }

    let response = await this.client.request(
      `/api/v2/projects/${this.configuration.projectId}/entry-points`,
      {
        method: 'POST',
        body: JSON.stringify({
          repeaterId,
          request: {
            method: target.method,
            url: target.url,
            headers: target.headers,
            body: target.postData?.text
          }
        }),
        headers: {
          'content-type': 'application/json'
        }
      }
    );

    if (response.status === 409 && response.headers.has('location')) {
      const location = response.headers.get('location') as string;
      response = await this.client.request(location);
    }

    const data = (await response.json()) as { id: string };

    return data;
  }
}
