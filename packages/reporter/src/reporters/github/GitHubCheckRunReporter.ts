import { Reporter } from '../../lib';
import { GITHUB_CLIENT, GITHUB_CONFIG } from './api';
import type { GitHubClient } from './api';
import { SingleItemPayloadBuilder, MultiItemsPayloadBuilder } from './builders';
import type { CheckRunPayloadBuilder } from './builders';
import type { GitHubConfig } from './types';
import { TEST_FILE_PATH_RESOLVER, TestFilePathResolver } from '../../utils';
import { inject, injectable } from 'tsyringe';
import type { Issue, Scan } from '@sectester/scan';

// TODO add `GitHubCheckRunReporter` description to README
@injectable()
export class GitHubCheckRunReporter implements Reporter {
  constructor(
    @inject(GITHUB_CONFIG) private readonly config: GitHubConfig,
    @inject(GITHUB_CLIENT) private readonly githubClient: GitHubClient,
    @inject(TEST_FILE_PATH_RESOLVER)
    private readonly testFilePathResolver: TestFilePathResolver
  ) {
    if (!this.config.token) {
      throw new Error('GitHub token is not set');
    }

    if (!this.config.repository) {
      throw new Error('GitHub repository is not set');
    }

    if (!this.config.commitSha) {
      throw new Error('GitHub commitSha is not set');
    }
  }

  public async report(scan: Scan): Promise<void> {
    const issues = await scan.issues();
    if (issues.length === 0) return;

    const checkRunPayload = this.createCheckRunPayloadBuilder(issues).build();
    await this.githubClient.createCheckRun(checkRunPayload);
  }

  private createCheckRunPayloadBuilder(
    issues: Issue[]
  ): CheckRunPayloadBuilder {
    const testFilePath = this.testFilePathResolver.getTestFilePath();

    return issues.length === 1
      ? new SingleItemPayloadBuilder(
          issues[0],
          this.config.commitSha,
          testFilePath
        )
      : new MultiItemsPayloadBuilder(
          issues,
          this.config.commitSha,
          testFilePath
        );
  }
}
