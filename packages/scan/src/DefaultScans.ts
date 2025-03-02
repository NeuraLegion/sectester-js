import { Scans } from './Scans';
import { Issue, ScanConfig, ScanState } from './models';
import { inject, injectable } from 'tsyringe';
import { ApiClient, ApiError, Configuration } from '@sectester/core';
import ci from 'ci-info';

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
      headers: {
        'content-type': 'application/json'
      },
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
      link: `${this.configuration.baseURL}/scans/${id}/issues/${x.id}`
    }));
  }

  public async stopScan(id: string): Promise<void> {
    try {
      await this.client.request(`/api/v1/scans/${id}/stop`);
    } catch (error) {
      if (error instanceof ApiError && error.response.status === 404) {
        return;
      }

      throw error;
    }
  }

  public async deleteScan(id: string): Promise<void> {
    try {
      await this.client.request(`/api/v1/scans/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      if (error instanceof ApiError && error.response.status === 404) {
        return;
      }

      throw error;
    }
  }

  public async getScan(id: string): Promise<ScanState> {
    const response = await this.client.request(`/api/v1/scans/${id}`);
    const result = (await response.json()) as ScanState;

    return result;
  }
}
