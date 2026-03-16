import { type Report, type ReportAnnotation } from '../types';
import { BITBUCKET_CONFIG, BitbucketConfig } from './BitbucketConfig';
import type { BitbucketClient } from './BitbucketClient';
import { fetch, ProxyAgent } from 'undici';
import { inject, injectable } from 'tsyringe';

@injectable()
export class BitbucketApiClient implements BitbucketClient {
  private readonly proxyAgent: ProxyAgent | undefined;

  constructor(
    @inject(BITBUCKET_CONFIG) private readonly config: BitbucketConfig
  ) {
    if (this.config.usePipelinesProxy) {
      this.proxyAgent = new ProxyAgent({
        uri: this.config.proxyUrl ?? 'http://localhost:29418',
        proxyTunnel: false
      });
    }
  }

  public async createOrUpdateReport(
    reportId: string,
    report: Report
  ): Promise<void> {
    const url = this.buildUrl(
      `/repositories/${this.config.workspace}/${this.config.repo}/commit/${this.config.commitSha}/reports/${reportId}`
    );

    const res = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(report),
      dispatcher: this.proxyAgent
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(
        `Bitbucket API error: ${res.status} ${res.statusText}: ${errorBody}`
      );
    }
  }

  public async createAnnotations(
    reportId: string,
    annotations: ReportAnnotation[]
  ): Promise<void> {
    if (annotations.length === 0) {
      return;
    }

    const url = this.buildUrl(
      `/repositories/${this.config.workspace}/${this.config.repo}/commit/${this.config.commitSha}/reports/${reportId}/annotations`
    );

    // Bitbucket API allows up to 100 annotations per request
    const chunks = this.chunkArray(annotations, 100);

    for (const chunk of chunks) {
      const res = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(chunk),
        dispatcher: this.proxyAgent
      });

      if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(
          `Bitbucket API error: ${res.status} ${res.statusText}: ${errorBody}`
        );
      }
    }
  }

  private buildUrl(path: string): string {
    // When using the Pipelines proxy, use http:// instead of https://
    const baseUrl = this.config.usePipelinesProxy
      ? 'http://api.bitbucket.org/2.0'
      : 'https://api.bitbucket.org/2.0';

    return `${baseUrl}${path}`;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'content-Type': 'application/json',
      'accept': 'application/json'
    };

    // Only add authorization header when not using the Pipelines proxy
    // The proxy automatically adds authentication
    if (!this.config.usePipelinesProxy && this.config.token) {
      headers['authorization'] = `Bearer ${this.config.token}`;
    }

    return headers;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];

    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }

    return chunks;
  }
}
