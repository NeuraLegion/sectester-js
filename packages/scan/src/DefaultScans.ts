import { Scans, UploadHarOptions } from './Scans';
import { Issue, ScanConfig, ScanState } from './models';
import { inject, injectable } from 'tsyringe';
import { ApiClient, Configuration } from '@sectester/core';
import ci from 'ci-info';
import { File } from 'node:buffer';

@injectable()
export class DefaultScans implements Scans {
  constructor(
    private readonly configuration: Configuration,
    @inject(ApiClient)
    private readonly client: ApiClient
  ) {}

  public async createScan(config: ScanConfig): Promise<{ id: string }> {
    const response = await this.client.request('/api/v1/scans', {
      method: 'POST',
      body: JSON.stringify({
        ...config,
        info: {
          source: 'utlib',
          provider: ci.name,
          client: {
            name: this.configuration.name,
            version: this.configuration.version
          }
        }
      })
    });
    const result = (await response.json()) as { id: string };

    return result;
  }

  public async listIssues(id: string): Promise<Issue[]> {
    const response = await this.client.request(`/api/v1/scans/${id}/issues`);
    const issues = (await response.json()) as (Omit<Issue, 'link' | 'time'> & {
      time: string;
    })[];

    return issues.map(x => ({
      ...x,
      time: new Date(x.time),
      link: `${this.configuration.api}/scans/${id}/issues/${x.id}`
    }));
  }

  public async stopScan(id: string): Promise<void> {
    await this.client.request(`/api/v1/scans/${id}/stop`, {
      method: 'POST'
    });
  }

  public async deleteScan(id: string): Promise<void> {
    await this.client.request(`/api/v1/scans/${id}`, {
      method: 'DELETE'
    });
  }

  public async getScan(id: string): Promise<ScanState> {
    const response = await this.client.request(`/api/v1/scans/${id}`);
    const result = (await response.json()) as ScanState;

    return result;
  }

  public async uploadHar(options: UploadHarOptions): Promise<{ id: string }> {
    const file = new File([JSON.stringify(options.har)], options.filename, {
      type: 'application/json'
    });
    const payload = new FormData();
    payload.append('file', file, options.filename);

    const query = new URLSearchParams();
    query.set('discard', (options.discard ?? false).toString());

    const response = await this.client.request(
      `/api/v1/files?${query.toString()}`,
      {
        method: 'POST',
        body: payload
      }
    );

    const result = (await response.json()) as { id: string };

    return result;
  }
}
