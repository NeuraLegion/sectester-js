import { Scans } from './Scans';
import { Issue, ScanConfig, ScanState } from './models';
import { BrokenAccessControlTest } from './models/Tests';
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
        ...this.transformConfig(config),
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

  private transformConfig(config: ScanConfig): Record<string, unknown> {
    if (!config.tests) {
      return { ...config };
    }

    const { mappedTests, testMetadata } = this.mapTests(config.tests);
    const { tests: originalTests, ...restConfig } = config;

    if (Object.keys(testMetadata).length > 0) {
      const result: Record<string, unknown> = {
        ...restConfig,
        tests: mappedTests,
        testMetadata
      };

      return result;
    }

    return { ...config };
  }

  private mapTests(tests: ScanConfig['tests']) {
    const mappedTests: string[] = [];
    const testMetadata: Record<string, unknown> = {};

    if (!tests) {
      throw new Error('Scan config should have tests defined');
    }

    for (const test of tests) {
      if (typeof test === 'string') {
        mappedTests.push(test);
        continue;
      }

      if (test.name === 'broken_access_control') {
        this.mapBrokenAccessControlTest(test, mappedTests, testMetadata);
      } else {
        throw new Error(`Unsupported configurable test: ${test.name}`);
      }
    }

    return { mappedTests, testMetadata };
  }

  private mapBrokenAccessControlTest(
    test: BrokenAccessControlTest,
    mappedTests: string[],
    testMetadata: Record<string, unknown>
  ) {
    if (!test.options?.auth) {
      throw new Error('Auth option is required for broken_access_control test');
    }

    const { auth } = test.options;
    if (
      typeof auth !== 'string' &&
      (!Array.isArray(auth) || auth.length !== 2)
    ) {
      throw new Error(
        `${test.name} test auth option must be either a string or a tuple of two strings`
      );
    }

    mappedTests.push(test.name);
    testMetadata[test.name] = {
      authObjectId: typeof auth === 'string' ? [null, auth] : [auth[0], auth[1]]
    };
  }
}
