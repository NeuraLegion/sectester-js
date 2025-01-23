import type { CheckRunPayload, GitHubConfig } from '../types';
import type { GitHubClient } from './GitHubClient';
import { GITHUB_CONFIG } from './GitHubConfig';
import { inject, injectable } from 'tsyringe';

@injectable()
export class GitHubApiClient implements GitHubClient {
  constructor(@inject(GITHUB_CONFIG) private readonly config: GitHubConfig) {}

  public async createCheckRun(payload: CheckRunPayload): Promise<void> {
    const requestOptions = {
      method: 'POST',
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Authorization': `Bearer ${this.config.token}`,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    };

    const res = await fetch(
      `https://api.github.com/repos/${this.config.repository}/check-runs`,
      requestOptions
    );

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }
  }
}
